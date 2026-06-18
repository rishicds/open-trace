import { z } from 'zod';
import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { normalizePageUrl } from '../utils/pageUrl.js';
import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

const eventSchema = z.object({
  session_id: z.string(),
  event_type: z.enum(['page_view', 'click', 'scroll_depth', 'mouse_move', 'rage_click', 'dead_click']),
  page_url: z.string().min(1),
  timestamp: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  target_tag: z.string().optional(),
  target_id: z.string().optional(),
  target_class: z.string().optional(),
  depth_pct: z.number().optional(),
  path: z.array(z.object({ x: z.number(), y: z.number(), t: z.number() })).optional(),
  sub_type: z.enum(['rage', 'dead']).nullable().optional(),
});

const batchSchema = z.object({
  events: z.array(z.unknown()),
});

export async function ingestEvents(req: Request, res: Response) {
  try {
    const body = batchSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Invalid request body', details: body.error });
      return;
    }

    const validEvents: any[] = [];
    let dropped = 0;

    for (const raw of body.data.events) {
      const result = eventSchema.safeParse(raw);
      if (result.success) {
        validEvents.push({
          ...result.data,
          page_url: normalizePageUrl(result.data.page_url),
          timestamp: new Date(result.data.timestamp),
          received_at: new Date(),
        });
      } else {
        dropped++;
      }
    }

    if (validEvents.length > 0) {
      // Bulk insert events
      const inserted = await Event.insertMany(validEvents, { ordered: false });

      // Upsert sessions grouped by session_id
      const sessionGroups = new Map<string, typeof validEvents>();
      for (const event of validEvents) {
        const group = sessionGroups.get(event.session_id) || [];
        group.push(event);
        sessionGroups.set(event.session_id, group);
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'];

      const upsertPromises = [];
      for (const [sessionId, events] of sessionGroups) {
        upsertPromises.push(upsertSession(sessionId, events, userAgent, ip));
      }
      await Promise.all(upsertPromises);

      // Broadcast via Socket.io
      const io: Server | undefined = req.app.get('io');
      if (io) {
        for (const event of inserted) {
          io.emit('event', event.toObject());
        }
      }
    }

    res.status(202).json({ accepted: validEvents.length, dropped });
  } catch (err) {
    console.error('[Events] Ingestion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function upsertSession(sessionId: string, events: any[], userAgent?: string, ip?: string) {
  const timestamps = events.map((e: any) => new Date(e.timestamp).getTime());
  const minTs = new Date(Math.min(...timestamps));
  const maxTs = new Date(Math.max(...timestamps));
  const pageUrls = [...new Set(events.map((e: any) => e.page_url as string))];
  const hasRage = events.some(
    (e: any) => e.event_type === 'rage_click' || e.sub_type === 'rage'
  );
  const hasDead = events.some(
    (e: any) => e.event_type === 'dead_click' || e.sub_type === 'dead'
  );
  const scrollDepths = events
    .filter((e: any) => e.event_type === 'scroll_depth' && e.depth_pct != null)
    .map((e: any) => e.depth_pct as number);
  const maxScroll = scrollDepths.length > 0 ? Math.max(...scrollDepths) : 0;

  const existing = await Session.findOne({ session_id: sessionId });

  let browser = null;
  let os = null;
  let device = null;
  let city = null;
  let country = null;

  if (userAgent) {
    const parser = new UAParser(userAgent);
    browser = parser.getBrowser().name || null;
    os = parser.getOS().name || null;
    const deviceType = parser.getDevice().type;
    device = deviceType || (os === 'iOS' || os === 'Android' ? 'Mobile' : 'Desktop');
  }

  if (ip === '::1' || ip === '127.0.0.1' || ip?.includes('192.168.') || !ip) {
    city = 'San Francisco';
    country = 'US';
  } else {
    const geo = geoip.lookup(ip);
    if (geo) {
      city = geo.city;
      country = geo.country;
    }
  }

  if (existing) {
    const allPages = [...new Set([...existing.pages_visited, ...pageUrls])];
    const newStarted = new Date(Math.min(existing.started_at.getTime(), minTs.getTime()));
    const newLastSeen = new Date(Math.max(existing.last_seen_at.getTime(), maxTs.getTime()));
    const newDuration = newLastSeen.getTime() - newStarted.getTime();
    const newEventCount = existing.event_count + events.length;
    const newMaxScroll = Math.max(existing.max_scroll_pct, maxScroll);
    const bounce = newEventCount <= 1 || newDuration < 10000;

    const updateDoc: any = {
      started_at: newStarted,
      last_seen_at: newLastSeen,
      duration_ms: newDuration,
      event_count: newEventCount,
      page_count: allPages.length,
      pages_visited: allPages,
      has_rage_click: existing.has_rage_click || hasRage,
      has_dead_click: existing.has_dead_click || hasDead,
      bounce,
      max_scroll_pct: newMaxScroll,
    };

    if (!existing.browser && browser) {
      updateDoc.browser = browser;
      updateDoc.os = os;
      updateDoc.device = device;
    }
    if (!existing.city && city) {
      updateDoc.city = city;
      updateDoc.country = country;
    }

    await Session.updateOne(
      { session_id: sessionId },
      { $set: updateDoc }
    );
  } else {
    const duration = maxTs.getTime() - minTs.getTime();
    const bounce = events.length <= 1 || duration < 10000;

    await Session.create({
      session_id: sessionId,
      started_at: minTs,
      last_seen_at: maxTs,
      duration_ms: duration,
      event_count: events.length,
      page_count: pageUrls.length,
      pages_visited: pageUrls,
      has_rage_click: hasRage,
      has_dead_click: hasDead,
      bounce,
      max_scroll_pct: maxScroll,
      browser,
      os,
      device,
      city,
      country,
    });
  }
}

import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import type { Request, Response } from 'express';

export async function getSessions(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const rageOnly = req.query.rage_only === 'true';
    const url = req.query.url as string | undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const filter: Record<string, any> = {};
    if (rageOnly) filter.has_rage_click = true;
    if (url) filter.pages_visited = url;
    if (from || to) {
      filter.started_at = {};
      if (from) filter.started_at.$gte = from;
      if (to) filter.started_at.$lte = to;
    }

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .sort({ started_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Session.countDocuments(filter),
    ]);

    res.json({
      sessions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[Sessions] List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSessionEvents(req: Request, res: Response) {
  try {
    const { session_id } = req.params;

    const events = await Event.find({ session_id })
      .sort({ timestamp: 1 })
      .lean();

    res.json({ session_id, events });
  } catch (err) {
    console.error('[Sessions] Events error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSessionReplay(req: Request, res: Response) {
  try {
    const { session_id } = req.params;

    // Get all mouse_move and click events for the session
    const events = await Event.find({
      session_id,
      event_type: { $in: ['mouse_move', 'click', 'rage_click', 'dead_click', 'page_view'] },
    })
      .sort({ timestamp: 1 })
      .lean();

    // Group by page_url into segments
    const segmentMap = new Map<string, { page_url: string; started_at: Date; path: any[]; clicks: any[] }>();
    let currentUrl = '';

    for (const event of events) {
      if (event.event_type === 'page_view') {
        currentUrl = event.page_url;
      }

      const url = event.page_url || currentUrl;
      if (!segmentMap.has(url)) {
        segmentMap.set(url, {
          page_url: url,
          started_at: event.timestamp,
          path: [],
          clicks: [],
        });
      }

      const segment = segmentMap.get(url)!;
      const relativeMs = event.timestamp.getTime() - segment.started_at.getTime();

      if (event.event_type === 'mouse_move' && event.path) {
        for (const point of event.path) {
          segment.path.push({ x: point.x, y: point.y, t: point.t });
        }
      }

      if (['click', 'rage_click', 'dead_click'].includes(event.event_type) && event.x != null && event.y != null) {
        segment.clicks.push({
          x: event.x,
          y: event.y,
          t: relativeMs,
          sub_type: event.sub_type || null,
        });
      }
    }

    const segments = Array.from(segmentMap.values());

    res.json({ session_id, segments });
  } catch (err) {
    console.error('[Sessions] Replay error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function generateSummary(req: Request, res: Response) {
  try {
    const { session_id } = req.params;

    // Get session
    const session = await Session.findOne({ session_id });
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Check for cached summary (unless force regenerate)
    if (session.ai_summary && !req.query.regenerate) {
      res.json({ session_id, summary: session.ai_summary });
      return;
    }

    // Get events for context
    const events = await Event.find({ session_id })
      .sort({ timestamp: 1 })
      .lean();

    // Format events as text for the AI prompt
    const eventsText = events
      .filter(e => e.event_type !== 'mouse_move') // Skip verbose mouse data
      .map(e => {
        const ts = e.timestamp.toISOString();
        let desc = `[${ts}] ${e.event_type} on ${e.page_url}`;
        if (e.x != null && e.y != null) desc += ` at (${e.x}, ${e.y})`;
        if (e.target_tag) desc += ` target=${e.target_tag}`;
        if (e.target_id) desc += `#${e.target_id}`;
        if (e.depth_pct != null) desc += ` depth=${e.depth_pct}%`;
        if (e.sub_type) desc += ` [${e.sub_type}]`;
        return desc;
      })
      .join('\n');

    const prompt = `You are an analyst summarizing a user session on an e-commerce website.
Given the ordered list of events below, write a 2-3 sentence plain-language
summary of what the user did, noting any rage clicks, dead clicks, or
drop-off points. Be concise and factual. Do not speculate about intent.

Events:
${eventsText}`;

    // Call NVIDIA NIM API (OpenAI-compatible)
    const apiUrl = process.env.AI_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || 'meta/llama-3.1-8b-instruct';

    if (!apiKey) {
      // Fallback: generate a basic summary without AI
      const summary = generateBasicSummary(events);
      await Session.updateOne(
        { session_id },
        { $set: { ai_summary: summary, ai_generated_at: new Date() } }
      );
      res.json({ session_id, summary });
      return;
    }

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      console.error('[AI] API error:', aiResponse.status, await aiResponse.text());
      // Fallback to basic summary
      const summary = generateBasicSummary(events);
      await Session.updateOne(
        { session_id },
        { $set: { ai_summary: summary, ai_generated_at: new Date() } }
      );
      res.json({ session_id, summary });
      return;
    }

    const aiData = await aiResponse.json() as any;
    const summary = aiData.choices?.[0]?.message?.content || generateBasicSummary(events);

    // Cache the summary
    await Session.updateOne(
      { session_id },
      { $set: { ai_summary: summary, ai_generated_at: new Date() } }
    );

    res.json({ session_id, summary });
  } catch (err) {
    console.error('[Sessions] Summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateBasicSummary(events: any[]): string {
  const pageViews = events.filter(e => e.event_type === 'page_view');
  const clicks = events.filter(e => e.event_type === 'click');
  const rageClicks = events.filter(e => e.event_type === 'rage_click' || e.sub_type === 'rage');
  const deadClicks = events.filter(e => e.event_type === 'dead_click' || e.sub_type === 'dead');
  const scrolls = events.filter(e => e.event_type === 'scroll_depth');
  const maxScroll = scrolls.length > 0 ? Math.max(...scrolls.map(s => s.depth_pct || 0)) : 0;
  const pages = [...new Set(pageViews.map(e => new URL(e.page_url).pathname))];

  let summary = `The user visited ${pages.length} page(s): ${pages.join(' → ')}.`;
  summary += ` They performed ${clicks.length} click(s)`;
  if (maxScroll > 0) summary += ` and scrolled to ${maxScroll}%`;
  summary += '.';
  if (rageClicks.length > 0) summary += ` ${rageClicks.length} rage click(s) detected.`;
  if (deadClicks.length > 0) summary += ` ${deadClicks.length} dead click(s) detected.`;

  return summary;
}

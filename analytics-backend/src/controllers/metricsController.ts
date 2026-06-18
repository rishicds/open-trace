import { Session } from '../models/Session.js';
import { Event } from '../models/Event.js';
import type { Request, Response } from 'express';

export async function getMetrics(req: Request, res: Response) {
  try {
    const from = req.query.from
      ? new Date(req.query.from as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

    const dateFilter = { started_at: { $gte: from, $lte: to } };

    const [sessions, totalEvents, topPages, topRageTargets] = await Promise.all([
      Session.find(dateFilter).lean(),
      Event.countDocuments({ received_at: { $gte: from, $lte: to } }),
      Event.aggregate([
        { $match: { event_type: 'page_view', timestamp: { $gte: from, $lte: to } } },
        { $group: { _id: '$page_url', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $project: { url: '$_id', views: 1, _id: 0 } },
      ]),
      Event.aggregate([
        { $match: { event_type: 'rage_click', timestamp: { $gte: from, $lte: to } } },
        { $group: { _id: '$target_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { target_id: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    const totalSessions = sessions.length;
    const bounceSessions = sessions.filter(s => s.bounce).length;
    const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 1000) / 10 : 0;
    const avgDuration = totalSessions > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.duration_ms, 0) / totalSessions)
      : 0;
    const avgEvents = totalSessions > 0
      ? Math.round((sessions.reduce((sum, s) => sum + s.event_count, 0) / totalSessions) * 10) / 10
      : 0;
    const rageClickSessions = sessions.filter(s => s.has_rage_click).length;

    res.json({
      total_sessions: totalSessions,
      total_events: totalEvents,
      bounce_rate_pct: bounceRate,
      avg_duration_ms: avgDuration,
      avg_events_per_session: avgEvents,
      rage_click_sessions: rageClickSessions,
      top_pages: topPages,
      top_rage_click_targets: topRageTargets,
    });
  } catch (err) {
    console.error('[Metrics] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

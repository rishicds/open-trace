import { Event } from '../models/Event.js';
import type { Request, Response } from 'express';

export async function getHeatmap(req: Request, res: Response) {
  try {
    const url = req.query.url as string;
    if (!url) {
      res.status(400).json({ error: 'url query parameter is required' });
      return;
    }

    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const type = (req.query.type as string) || 'all';

    const filter: Record<string, any> = {
      page_url: url,
      event_type: { $in: ['click', 'rage_click', 'dead_click'] },
    };

    if (type === 'rage') {
      filter.event_type = 'rage_click';
    } else if (type === 'dead') {
      filter.event_type = 'dead_click';
    }

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = from;
      if (to) filter.timestamp.$lte = to;
    }

    const events = await Event.find(filter)
      .select('x y sub_type')
      .lean();

    const points = events
      .filter(e => e.x != null && e.y != null)
      .map(e => ({ x: e.x!, y: e.y!, sub_type: e.sub_type || null }));

    res.json({
      url,
      total_clicks: points.length,
      points,
    });
  } catch (err) {
    console.error('[Heatmap] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get distinct page URLs for the heatmap URL selector
export async function getDistinctUrls(_req: Request, res: Response) {
  try {
    const urls = await Event.distinct('page_url', {
      event_type: { $in: ['click', 'rage_click', 'dead_click', 'page_view'] },
    });
    res.json({ urls });
  } catch (err) {
    console.error('[Heatmap] Distinct URLs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

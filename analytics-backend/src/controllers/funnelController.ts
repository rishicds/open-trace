import { Funnel } from '../models/Funnel.js';
import { Session } from '../models/Session.js';
import { Event } from '../models/Event.js';
import type { Request, Response } from 'express';

export async function createFunnel(req: Request, res: Response) {
  try {
    const { name, steps } = req.body;
    if (!name || !steps || !Array.isArray(steps) || steps.length < 2) {
      res.status(400).json({ error: 'name and steps (array of at least 2 URLs) are required' });
      return;
    }

    const funnel = await Funnel.create({ name, steps });
    res.status(201).json(funnel);
  } catch (err) {
    console.error('[Funnels] Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFunnels(_req: Request, res: Response) {
  try {
    const funnels = await Funnel.find().sort({ created_at: -1 }).lean();
    res.json({ funnels });
  } catch (err) {
    console.error('[Funnels] List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function analyzeFunnel(req: Request, res: Response) {
  try {
    const { funnel_id } = req.params;
    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

    const funnel = await Funnel.findById(funnel_id);
    if (!funnel) {
      res.status(404).json({ error: 'Funnel not found' });
      return;
    }

    // Get all sessions in the time window
    const sessions = await Session.find({
      started_at: { $gte: from, $lte: to },
    }).lean();

    // For each session, check which funnel steps were visited (in order)
    const stepsResults = funnel.steps.map((stepUrl, index) => {
      let matchCount = 0;

      for (const session of sessions) {
        // Check if this session visited all steps up to and including this one in order
        const visitedPages = session.pages_visited;
        let allPreviousFound = true;

        for (let i = 0; i <= index; i++) {
          const stepToCheck = funnel.steps[i]!;
          // Use prefix matching or exact match
          const found = visitedPages.some(p =>
            p === stepToCheck || p.startsWith(stepToCheck)
          );
          if (!found) {
            allPreviousFound = false;
            break;
          }
        }

        if (allPreviousFound) matchCount++;
      }

      return {
        step: index + 1,
        url: stepUrl,
        sessions: matchCount,
        pct_of_start: 0, // computed below
      };
    });

    // Compute percentages relative to step 1
    const step1Count = stepsResults[0]?.sessions || 1;
    for (const step of stepsResults) {
      step.pct_of_start = Math.round((step.sessions / step1Count) * 1000) / 10;
    }

    const lastStep = stepsResults[stepsResults.length - 1];
    const overallConversion = lastStep ? lastStep.pct_of_start : 0;

    res.json({
      funnel_id: funnel._id,
      name: funnel.name,
      window: { from: from.toISOString(), to: to.toISOString() },
      steps: stepsResults,
      overall_conversion_pct: overallConversion,
    });
  } catch (err) {
    console.error('[Funnels] Analysis error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

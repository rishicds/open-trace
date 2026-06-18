import { Router } from 'express';
import { createFunnel, getFunnels, analyzeFunnel } from '../controllers/funnelController.js';

export const funnelsRouter = Router();

funnelsRouter.post('/funnels', createFunnel);
funnelsRouter.get('/funnels', getFunnels);
funnelsRouter.get('/funnels/:funnel_id/analysis', analyzeFunnel);

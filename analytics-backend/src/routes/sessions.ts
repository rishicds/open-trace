import { Router } from 'express';
import { getSessions, getSessionEvents, getSessionReplay, generateSummary } from '../controllers/sessionController.js';

export const sessionsRouter = Router();

sessionsRouter.get('/sessions', getSessions);
sessionsRouter.get('/sessions/:session_id/events', getSessionEvents);
sessionsRouter.get('/sessions/:session_id/replay', getSessionReplay);
sessionsRouter.post('/sessions/:session_id/summary', generateSummary);

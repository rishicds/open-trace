import { Router } from 'express';
import { ingestEvents } from '../controllers/eventController.js';

export const eventsRouter = Router();

eventsRouter.post('/events', ingestEvents);

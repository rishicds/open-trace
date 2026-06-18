import { Router } from 'express';
import { getHeatmap, getDistinctUrls } from '../controllers/heatmapController.js';

export const heatmapRouter = Router();

heatmapRouter.get('/heatmap', getHeatmap);
heatmapRouter.get('/heatmap/urls', getDistinctUrls);

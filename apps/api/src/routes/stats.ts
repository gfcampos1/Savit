import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStats } from '../services/stats.js';
import { getOrGenerateLatestWeekly } from '../services/weekly-summary.js';

export const statsRouter: Router = Router();
statsRouter.use(requireAuth);

statsRouter.get('/', async (req, res, next) => {
  try {
    const data = await getStats(req.user!.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export const weeklyRouter: Router = Router();
weeklyRouter.use(requireAuth);

weeklyRouter.get('/', async (req, res, next) => {
  try {
    const summary = await getOrGenerateLatestWeekly(req.user!.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

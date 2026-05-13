import { Router, Request, Response } from 'express';

const router = Router();

/**
 * נקודת כניסה להמרות — יישום מלא (תור, workers) יתווסף בהמשך.
 * 501 = ה-API קיים אך צינור העיבוד עדיין לא מחובר.
 */
router.post('/', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'CONVERSION_NOT_READY',
    message: 'Conversion API is not fully deployed yet. Use mock mode in development or connect workers.',
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'conversions' });
});

export default router;

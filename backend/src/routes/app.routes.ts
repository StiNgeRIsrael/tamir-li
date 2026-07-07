import { Router, Request, Response } from 'express';
import { ensureAppSettings, serializeAppSettings } from '../lib/app-settings';
import { optionalAuth } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

/** Public — clients poll to know when to reset local onboarding state. */
router.get('/onboarding', async (_req: Request, res: Response) => {
  try {
    const row = await ensureAppSettings();
    res.json(serializeAppSettings(row));
  } catch (e) {
    console.error('[app/onboarding]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load app settings' });
  }
});

const CATEGORIES = new Set(['images', 'documents', 'media', 'mixed']);
const FREQUENCIES = new Set(['daily', 'weekly', 'occasional']);
const PAINS = new Set(['limit', 'ads', 'size', 'speed']);
const ATTRIBUTIONS = new Set(['play_store', 'google_search', 'friend', 'social', 'other']);
const DECISIONS = new Set(['accepted', 'declined']);
const PLANS = new Set(['yearly', 'monthly']);

function pick(value: unknown, allowed: Set<string>, fallback: string): string {
  return typeof value === 'string' && allowed.has(value) ? value : fallback;
}

/** Public — stores onboarding quiz answers + attribution. Links userId when a JWT is present. */
router.post('/onboarding/submit', optionalAuth, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const offerDecision = pick(body.offerDecision, DECISIONS, 'declined');
    const rawPlan = typeof body.selectedPlan === 'string' && PLANS.has(body.selectedPlan)
      ? body.selectedPlan
      : null;

    await prisma.onboardingResponse.create({
      data: {
        userId: req.userId ?? null,
        sessionId: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
        offerGeneration: Number.isFinite(Number(body.offerGeneration))
          ? Math.max(0, Math.trunc(Number(body.offerGeneration)))
          : 0,
        category: pick(body.category, CATEGORIES, 'mixed'),
        frequency: pick(body.frequency, FREQUENCIES, 'occasional'),
        pain: pick(body.pain, PAINS, 'limit'),
        attribution: pick(body.attribution, ATTRIBUTIONS, 'other'),
        offerDecision,
        selectedPlan: offerDecision === 'accepted' ? rawPlan : null,
      },
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[app/onboarding/submit]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not save response' });
  }
});

export default router;

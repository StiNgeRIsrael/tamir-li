import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { generateAiImage } from '../lib/ai-generation';

const router = Router();

router.post('/generate-image', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      prompt?: string;
      style?: string;
      aspectRatio?: string;
      toolId?: string;
    };

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt || prompt.length > 2000) {
      res.status(400).json({
        error: 'INVALID_BODY',
        message: 'prompt is required (max 2000 characters)',
      });
      return;
    }

    const toolId =
      typeof body.toolId === 'string' && body.toolId.trim()
        ? body.toolId.trim()
        : 'ai-image-generator';

    const result = await generateAiImage({
      userId: req.userId!,
      toolId,
      prompt,
      style: typeof body.style === 'string' ? body.style : undefined,
      aspectRatio: typeof body.aspectRatio === 'string' ? body.aspectRatio : undefined,
    });

    if (!result.ok) {
      const status =
        result.code === 'INSUFFICIENT_CREDITS'
          ? 402
          : result.code === 'AI_DISABLED' || result.code === 'AI_NOT_CONFIGURED'
            ? 503
            : 502;
      res.status(status).json({
        error: result.code,
        message: result.error,
        logId: result.logId,
      });
      return;
    }

    res.json({
      imageDataUrl: result.imageDataUrl,
      mimeType: result.mimeType,
      creditsRemaining: result.creditsRemaining,
      logId: result.logId,
    });
  } catch (e) {
    console.error('[ai/generate-image]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Image generation failed' });
  }
});

export default router;

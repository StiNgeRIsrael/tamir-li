import { AiGenerationStatus, Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { DEFAULT_AI_MODEL, ensureAiSettings } from './ai-settings';

/** Rough Imagen 3 list price per image (USD) — for admin cost dashboards only. */
export const ESTIMATED_COST_USD_PER_IMAGE = 0.03;

export type GenerateImageInput = {
  userId: string;
  toolId: string;
  prompt: string;
  style?: string;
  aspectRatio?: string;
};

export type GenerateImageResult =
  | { ok: true; imageDataUrl: string; mimeType: string; creditsRemaining: number; logId: string }
  | { ok: false; error: string; code: string; logId?: string };

function buildPrompt(prompt: string, style?: string, aspectRatio?: string): string {
  const parts = [prompt.trim()];
  if (style && style !== 'realistic') {
    parts.push(`Style: ${style}`);
  }
  if (aspectRatio) {
    parts.push(`Aspect ratio: ${aspectRatio}`);
  }
  return parts.join('. ');
}

function truncatePrompt(prompt: string, max = 200): string {
  return prompt.length <= max ? prompt : `${prompt.slice(0, max - 1)}…`;
}

async function deductCredit(userId: string): Promise<{ ok: true; balance: number } | { ok: false }> {
  const row = await prisma.aiCredit.findUnique({ where: { userId } });
  if (!row || row.balance < 1) {
    return { ok: false };
  }
  const updated = await prisma.aiCredit.update({
    where: { userId },
    data: { balance: { decrement: 1 } },
  });
  return { ok: true, balance: updated.balance };
}

async function refundCredit(userId: string): Promise<void> {
  await prisma.aiCredit.update({
    where: { userId },
    data: { balance: { increment: 1 } },
  }).catch(() => undefined);
}

async function logGeneration(params: {
  userId: string;
  toolId: string;
  status: AiGenerationStatus;
  creditsCharged: number;
  model: string | null;
  prompt: string;
  errorMessage?: string;
  durationMs?: number;
}): Promise<string> {
  const row = await prisma.aiGenerationLog.create({
    data: {
      userId: params.userId,
      toolId: params.toolId,
      status: params.status,
      creditsCharged: params.creditsCharged,
      estimatedCostUsd:
        params.status === AiGenerationStatus.SUCCESS
          ? new Prisma.Decimal(ESTIMATED_COST_USD_PER_IMAGE)
          : null,
      provider: 'google',
      model: params.model,
      promptPreview: truncatePrompt(params.prompt),
      errorMessage: params.errorMessage,
      durationMs: params.durationMs,
    },
  });
  return row.id;
}

type GoogleImageResult = { base64: string; mimeType: string };

async function callGoogleImageApi(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<GoogleImageResult> {
  const isGemini = model.toLowerCase().startsWith('gemini');

  if (isGemini) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    const json = (await res.json()) as {
      error?: { message?: string };
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
      }>;
    };
    if (!res.ok) {
      throw new Error(json.error?.message ?? `Google API error ${res.status}`);
    }
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error('No image returned from Gemini model');
    }
    return {
      base64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType ?? 'image/png',
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 },
    }),
  });
  const json = (await res.json()) as {
    error?: { message?: string };
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  };
  if (!res.ok) {
    throw new Error(json.error?.message ?? `Google API error ${res.status}`);
  }
  const prediction = json.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) {
    throw new Error('No image returned from Imagen model');
  }
  return {
    base64: prediction.bytesBase64Encoded,
    mimeType: prediction.mimeType ?? 'image/png',
  };
}

export async function generateAiImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const fullPrompt = buildPrompt(input.prompt, input.style, input.aspectRatio);
  const settings = await ensureAiSettings();
  const model = settings.modelName || DEFAULT_AI_MODEL;

  if (!settings.enabled) {
    const logId = await logGeneration({
      userId: input.userId,
      toolId: input.toolId,
      status: AiGenerationStatus.FAILED,
      creditsCharged: 0,
      model,
      prompt: fullPrompt,
      errorMessage: 'AI generation disabled',
    });
    return { ok: false, error: 'AI generation is disabled', code: 'AI_DISABLED', logId };
  }

  if (!settings.googleApiKey) {
    const logId = await logGeneration({
      userId: input.userId,
      toolId: input.toolId,
      status: AiGenerationStatus.FAILED,
      creditsCharged: 0,
      model,
      prompt: fullPrompt,
      errorMessage: 'Google API key not configured',
    });
    return { ok: false, error: 'AI service not configured', code: 'AI_NOT_CONFIGURED', logId };
  }

  const credit = await deductCredit(input.userId);
  if (!credit.ok) {
    const logId = await logGeneration({
      userId: input.userId,
      toolId: input.toolId,
      status: AiGenerationStatus.FAILED,
      creditsCharged: 0,
      model,
      prompt: fullPrompt,
      errorMessage: 'Insufficient credits',
    });
    return { ok: false, error: 'Insufficient AI credits', code: 'INSUFFICIENT_CREDITS', logId };
  }

  const started = Date.now();
  try {
    const image = await callGoogleImageApi(settings.googleApiKey, model, fullPrompt);
    const logId = await logGeneration({
      userId: input.userId,
      toolId: input.toolId,
      status: AiGenerationStatus.SUCCESS,
      creditsCharged: 1,
      model,
      prompt: fullPrompt,
      durationMs: Date.now() - started,
    });
    const imageDataUrl = `data:${image.mimeType};base64,${image.base64}`;
    return {
      ok: true,
      imageDataUrl,
      mimeType: image.mimeType,
      creditsRemaining: credit.balance,
      logId,
    };
  } catch (err) {
    await refundCredit(input.userId);
    const message = err instanceof Error ? err.message : 'Generation failed';
    const logId = await logGeneration({
      userId: input.userId,
      toolId: input.toolId,
      status: AiGenerationStatus.FAILED,
      creditsCharged: 0,
      model,
      prompt: fullPrompt,
      errorMessage: message,
      durationMs: Date.now() - started,
    });
    return { ok: false, error: message, code: 'GENERATION_FAILED', logId };
  }
}

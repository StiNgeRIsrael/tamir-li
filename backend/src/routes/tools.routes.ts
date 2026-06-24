import { Router, Request, Response } from 'express';
import {
  CONFIG_CACHE_KEYS,
  getCachedConfig,
  setCachedConfig,
} from '../lib/config-cache';
import { prisma } from '../lib/prisma';
import { KNOWN_TOOL_IDS } from '../data/tool-catalog';

const router = Router();

type ToolConfigRow = {
  toolId: string;
  enabled: boolean;
  featured: boolean;
  sortOrder: number;
};

function buildToolConfigResponse(rows: ToolConfigRow[]) {
  const map = new Map(rows.map((r) => [r.toolId, r]));
  const tools = KNOWN_TOOL_IDS.map((id, index) => {
    const row = map.get(id);
    return {
      toolId: id,
      enabled: row?.enabled ?? true,
      featured: row?.featured ?? false,
      sortOrder: row?.sortOrder ?? index * 10,
    };
  });
  tools.sort((a, b) => a.sortOrder - b.sortOrder);
  return { tools };
}

const CONFIG_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

/** הגדרות תצוגה ציבוריות (בלי אימות) — לא תוכן רגיש */
router.get('/config', async (_req: Request, res: Response) => {
  res.set('Cache-Control', CONFIG_CACHE_CONTROL);
  const cached = getCachedConfig<ReturnType<typeof buildToolConfigResponse>>(CONFIG_CACHE_KEYS.TOOLS);
  if (cached) {
    res.json(cached);
    return;
  }
  try {
    const rows = await prisma.toolConfig.findMany();
    const payload = buildToolConfigResponse(rows);
    setCachedConfig(CONFIG_CACHE_KEYS.TOOLS, payload);
    res.json(payload);
  } catch (e) {
    console.error('[tools/config] Prisma failure, serving defaults:', e);
    res.json(buildToolConfigResponse([]));
  }
});

export default router;

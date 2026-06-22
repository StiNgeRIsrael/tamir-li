import { Router, Request, Response } from 'express';
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

/** הגדרות תצוגה ציבוריות (בלי אימות) — לא תוכן רגיש */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.toolConfig.findMany();
    res.json(buildToolConfigResponse(rows));
  } catch (e) {
    console.error('[tools/config] Prisma failure, serving defaults:', e);
    res.json(buildToolConfigResponse([]));
  }
});

export default router;

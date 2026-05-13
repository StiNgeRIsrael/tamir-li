import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { KNOWN_TOOL_IDS } from '../data/tool-catalog';

const router = Router();

/** הגדרות תצוגה ציבוריות (בלי אימות) — לא תוכן רגיש */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.toolConfig.findMany();
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
    res.json({ tools });
  } catch (e) {
    console.error('[tools/config]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load tool config' });
  }
});

export default router;

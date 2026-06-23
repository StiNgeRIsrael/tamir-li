import { Router, Request, Response } from 'express';
import { Prisma, RoleType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/admin.middleware';
import { KNOWN_TOOL_IDS, TOOL_CATALOG_META, type KnownToolId } from '../data/tool-catalog';
import {
  ensureAdSettings,
  parseAdSettingsPatch,
  serializeAdSettings,
} from '../lib/ad-settings';

const router = Router();

router.use(requireAuth);
router.use(requireRoles(RoleType.ADMIN));

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      usersTotal,
      usersBlocked,
      usersNewWeek,
      usage24h,
      usageWeek,
      usageMonth,
      jobsByStatus,
      topTools,
      recentUsage,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { blocked: true } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.usageLog.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.usageLog.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.usageLog.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.conversionJob.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.usageLog.groupBy({
        by: ['toolId'],
        where: { createdAt: { gte: monthAgo } },
        _count: { _all: true },
        orderBy: { _count: { toolId: 'desc' } },
        take: 12,
      }),
      prisma.usageLog.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
        },
      }),
    ]);

    res.json({
      users: { total: usersTotal, blocked: usersBlocked, newLast7Days: usersNewWeek },
      usage: {
        last24Hours: usage24h,
        last7Days: usageWeek,
        last30Days: usageMonth,
      },
      conversionJobs: Object.fromEntries(jobsByStatus.map((j) => [j.status, j._count._all])) as Record<
        string,
        number
      >,
      topToolsByUsage: topTools.map((t) => ({
        toolId: t.toolId,
        count: t._count._all,
      })),
      recentActivity: recentUsage.map((u) => ({
        id: u.id,
        toolId: u.toolId,
        createdAt: u.createdAt,
        email: u.user?.email ?? null,
        sessionId: u.sessionId,
        fileSizeBytes: u.fileSizeBytes !== null ? String(u.fileSizeBytes) : null,
      })),
    });
  } catch (e) {
    console.error('[admin/stats]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load stats' });
  }
});

router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 25));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { profile: { is: { displayName: { contains: search } } } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          roles: true,
        },
      }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      users: rows.map((u) => ({
        id: u.id,
        email: u.email,
        blocked: u.blocked,
        displayName: u.profile?.displayName ?? null,
        avatarUrl: u.profile?.avatarUrl ?? null,
        locale: u.profile?.locale ?? 'he',
        roles: u.roles.map((r) => r.role),
        createdAt: u.createdAt,
      })),
    });
  } catch (e) {
    console.error('[admin/users]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not list users' });
  }
});

router.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const targetId = typeof rawId === 'string' ? rawId : rawId?.[0];
    if (!targetId) {
      res.status(400).json({ error: 'INVALID_PARAMS', message: 'Missing user id' });
      return;
    }
    const actorId = req.userId!;
    const body = req.body as {
      blocked?: boolean;
      roles?: RoleType[];
    };

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      include: { roles: true, profile: true },
    });
    if (!target) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
      return;
    }

    if (body.blocked !== undefined && typeof body.blocked !== 'boolean') {
      res.status(400).json({ error: 'INVALID_BODY', message: 'blocked must be boolean' });
      return;
    }

    if (body.blocked === true && targetId === actorId) {
      res.status(400).json({ error: 'INVALID_ACTION', message: 'Cannot block your own account' });
      return;
    }

    if (body.roles !== undefined) {
      if (!Array.isArray(body.roles) || body.roles.length === 0) {
        res.status(400).json({ error: 'INVALID_BODY', message: 'roles must be a non-empty array' });
        return;
      }
      const allowed = new Set(Object.values(RoleType));
      for (const r of body.roles) {
        if (!allowed.has(r)) {
          res.status(400).json({ error: 'INVALID_ROLE', message: `Invalid role: ${r}` });
          return;
        }
      }

      const hadAdmin = target.roles.some((r) => r.role === RoleType.ADMIN);
      const willHaveAdmin = body.roles.includes(RoleType.ADMIN);
      if (hadAdmin && !willHaveAdmin) {
        const otherAdmins = await prisma.userRole.count({
          where: { role: RoleType.ADMIN, userId: { not: targetId } },
        });
        if (otherAdmins === 0) {
          res.status(400).json({
            error: 'LAST_ADMIN',
            message: 'Cannot remove the last admin account',
          });
          return;
        }
      }

      await prisma.$transaction([
        prisma.userRole.deleteMany({ where: { userId: targetId } }),
        prisma.userRole.createMany({
          data: body.roles.map((role) => ({ userId: targetId, role })),
        }),
      ]);
    }

    if (body.blocked !== undefined) {
      await prisma.user.update({
        where: { id: targetId },
        data: { blocked: body.blocked },
      });
    }

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: targetId },
      include: { profile: true, roles: true },
    });

    res.json({
      user: {
        id: updated.id,
        email: updated.email,
        blocked: updated.blocked,
        displayName: updated.profile?.displayName ?? null,
        avatarUrl: updated.profile?.avatarUrl ?? null,
        locale: updated.profile?.locale ?? 'he',
        roles: updated.roles.map((r) => r.role),
        createdAt: updated.createdAt,
      },
    });
  } catch (e) {
    console.error('[admin/users patch]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not update user' });
  }
});

router.get('/tools', async (_req: Request, res: Response) => {
  try {
    const [configs, usageMonth] = await Promise.all([
      prisma.toolConfig.findMany(),
      prisma.usageLog.groupBy({
        by: ['toolId'],
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: { _all: true },
      }),
    ]);
    const usageMap = new Map(usageMonth.map((u) => [u.toolId, u._count._all]));
    const configMap = new Map(configs.map((c) => [c.toolId, c]));

    const tools = KNOWN_TOOL_IDS.map((id, index) => {
      const meta = TOOL_CATALOG_META[id];
      const row = configMap.get(id);
      return {
        toolId: id,
        label: meta.label,
        category: meta.category,
        defaultPremium: meta.defaultPremium,
        enabled: row?.enabled ?? true,
        featured: row?.featured ?? false,
        sortOrder: row?.sortOrder ?? index * 10,
        notes: row?.notes ?? null,
        usageLast30Days: usageMap.get(id) ?? 0,
      };
    });
    tools.sort((a, b) => a.sortOrder - b.sortOrder);

    res.json({ tools });
  } catch (e) {
    console.error('[admin/tools list]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load tools' });
  }
});

router.patch('/tools/:toolId', async (req: Request, res: Response) => {
  try {
    const rawParam = req.params.toolId;
    const rawId = typeof rawParam === 'string' ? rawParam : rawParam?.[0];
    if (!rawId || !(KNOWN_TOOL_IDS as readonly string[]).includes(rawId)) {
      res.status(404).json({ error: 'UNKNOWN_TOOL', message: 'Unknown tool id' });
      return;
    }
    const toolId = rawId as KnownToolId;

    const body = req.body as {
      enabled?: boolean;
      featured?: boolean;
      sortOrder?: number;
      notes?: string | null;
    };

    if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
      res.status(400).json({ error: 'INVALID_BODY', message: 'enabled must be boolean' });
      return;
    }
    if (body.featured !== undefined && typeof body.featured !== 'boolean') {
      res.status(400).json({ error: 'INVALID_BODY', message: 'featured must be boolean' });
      return;
    }
    if (body.sortOrder !== undefined && typeof body.sortOrder !== 'number') {
      res.status(400).json({ error: 'INVALID_BODY', message: 'sortOrder must be number' });
      return;
    }

    const updated = await prisma.toolConfig.upsert({
      where: { toolId },
      create: {
        toolId,
        enabled: body.enabled ?? true,
        featured: body.featured ?? false,
        sortOrder: body.sortOrder ?? 0,
        notes: body.notes ?? null,
      },
      update: {
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.featured !== undefined ? { featured: body.featured } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
    });

    const meta = TOOL_CATALOG_META[toolId];
    res.json({
      tool: {
        toolId: updated.toolId,
        label: meta.label,
        category: meta.category,
        enabled: updated.enabled,
        featured: updated.featured,
        sortOrder: updated.sortOrder,
        notes: updated.notes,
      },
    });
  } catch (e) {
    console.error('[admin/tools patch]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not update tool' });
  }
});

router.get('/ads/settings', async (_req: Request, res: Response) => {
  try {
    const row = await ensureAdSettings();
    res.json({ settings: serializeAdSettings(row) });
  } catch (e) {
    console.error('[admin/ads/settings GET]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load ad settings' });
  }
});

router.patch('/ads/settings', async (req: Request, res: Response) => {
  try {
    await ensureAdSettings();
    const { data, error } = parseAdSettingsPatch(req.body as Record<string, unknown>);
    if (error) {
      res.status(400).json({ error: 'INVALID_BODY', message: error });
      return;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'INVALID_BODY', message: 'No fields to update' });
      return;
    }

    const updated = await prisma.adSettings.update({
      where: { id: 'default' },
      data,
    });
    res.json({ settings: serializeAdSettings(updated) });
  } catch (e) {
    console.error('[admin/ads/settings PATCH]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not update ad settings' });
  }
});

export default router;

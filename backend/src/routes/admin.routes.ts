import { Router, Request, Response } from 'express';
import {
  PaymentStatus,
  Prisma,
  RoleType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/admin.middleware';
import { KNOWN_TOOL_IDS, TOOL_CATALOG_META, type KnownToolId } from '../data/tool-catalog';
import {
  grantInitialPremiumCredits,
  isActivePremium,
  SUBSCRIPTION_MRR_AGOROT,
} from '../lib/billing-shared';
import {
  computePremiumPeriodEnd,
  parseGrantCreditsAmount,
  parseGrantConversionsAmount,
  parsePremiumGrantDuration,
} from '../lib/admin-grant';
import {
  ensureAdSettings,
  parseAdSettingsPatch,
  respondAdSettingsDbError,
  saveAdSettings,
  serializeAdSettings,
} from '../lib/ad-settings';
import {
  ensureAiSettings,
  parseAiSettingsPatch,
  respondAiSettingsDbError,
  saveAiSettings,
  serializeAiSettingsAdmin,
} from '../lib/ai-settings';
import { CONFIG_CACHE_KEYS, invalidateConfigCache } from '../lib/config-cache';

const router = Router();

router.use(requireAuth);
router.use(requireRoles(RoleType.ADMIN));

function inferPaymentProvider(p: {
  stripePaymentIntentId: string | null;
  paypalTransactionId: string | null;
  metadata: unknown;
}): 'STRIPE' | 'PAYPAL' | null {
  if (p.stripePaymentIntentId) return 'STRIPE';
  if (p.paypalTransactionId) return 'PAYPAL';
  const meta = p.metadata as { provider?: string } | null;
  if (meta?.provider === 'stripe') return 'STRIPE';
  if (meta?.provider === 'paypal') return 'PAYPAL';
  return null;
}

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeSubStatuses = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING];

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
      activeSubscriptions,
      failedPayments,
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
      prisma.subscription.findMany({
        where: { status: { in: activeSubStatuses } },
        select: { plan: true, status: true, currentPeriodEnd: true },
      }),
      prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    ]);

    const premiumActive = activeSubscriptions.filter((s) =>
      isActivePremium(s.status, s.currentPeriodEnd)
    );
    const mrrEstimateAgorot = premiumActive.reduce(
      (sum, s) => sum + SUBSCRIPTION_MRR_AGOROT[s.plan],
      0
    );

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
      billing: {
        activeSubscriptions: premiumActive.length,
        mrrEstimateAgorot,
        failedPayments,
        currency: 'ils',
      },
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
          aiCredits: { select: { balance: true } },
          subscription: {
            select: {
              status: true,
              plan: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
            },
          },
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
        aiCreditsBalance: u.aiCredits?.balance ?? 0,
        bonusConversions: u.bonusConversions,
        subscription: u.subscription
          ? {
              status: u.subscription.status,
              plan: u.subscription.plan,
              isPremium: isActivePremium(
                u.subscription.status,
                u.subscription.currentPeriodEnd
              ),
              cancelAtPeriodEnd: u.subscription.cancelAtPeriodEnd,
            }
          : null,
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

router.patch('/users/:id/grant-premium', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const targetId = typeof rawId === 'string' ? rawId : rawId?.[0];
    if (!targetId) {
      res.status(400).json({ error: 'INVALID_PARAMS', message: 'Missing user id' });
      return;
    }

    const body = req.body as { duration?: unknown; plan?: unknown };
    const duration = parsePremiumGrantDuration(body.duration);
    if (!duration) {
      res.status(400).json({
        error: 'INVALID_BODY',
        message: 'duration must be one of: 30d, 90d, 1y, lifetime',
      });
      return;
    }

    let plan: SubscriptionPlan = SubscriptionPlan.MONTHLY;
    if (body.plan !== undefined) {
      if (body.plan !== SubscriptionPlan.MONTHLY && body.plan !== SubscriptionPlan.YEARLY) {
        res.status(400).json({ error: 'INVALID_BODY', message: 'plan must be MONTHLY or YEARLY' });
        return;
      }
      plan = body.plan;
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
      return;
    }

    const now = new Date();
    const periodEnd = computePremiumPeriodEnd(duration, now);

    const sub = await prisma.subscription.upsert({
      where: { userId: targetId },
      create: {
        userId: targetId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      update: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    await grantInitialPremiumCredits(targetId);

    res.json({
      subscription: {
        status: sub.status,
        plan: sub.plan,
        isPremium: isActivePremium(sub.status, sub.currentPeriodEnd),
        currentPeriodEnd: sub.currentPeriodEnd,
      },
    });
  } catch (e) {
    console.error('[admin/users grant-premium]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not grant premium' });
  }
});

router.patch('/users/:id/grant-credits', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const targetId = typeof rawId === 'string' ? rawId : rawId?.[0];
    if (!targetId) {
      res.status(400).json({ error: 'INVALID_PARAMS', message: 'Missing user id' });
      return;
    }

    const credits = parseGrantCreditsAmount((req.body as { credits?: unknown })?.credits);
    if (credits === null) {
      res.status(400).json({
        error: 'INVALID_BODY',
        message: 'credits must be an integer from 1 to 500',
      });
      return;
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
      return;
    }

    const row = await prisma.aiCredit.upsert({
      where: { userId: targetId },
      create: { userId: targetId, balance: credits },
      update: { balance: { increment: credits } },
    });

    res.json({ aiCredits: { balance: row.balance } });
  } catch (e) {
    console.error('[admin/users grant-credits]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not grant credits' });
  }
});

router.post('/users/:id/grant-conversions', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const targetId = typeof rawId === 'string' ? rawId : rawId?.[0];
    if (!targetId) {
      res.status(400).json({ error: 'INVALID_PARAMS', message: 'Missing user id' });
      return;
    }

    const body = req.body as { amount?: unknown; note?: unknown };
    const amount = parseGrantConversionsAmount(body.amount);
    if (amount === null) {
      res.status(400).json({
        error: 'INVALID_BODY',
        message: 'amount must be an integer from 1 to 100',
      });
      return;
    }

    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : undefined;
    if (note) {
      console.info('[admin/users grant-conversions] note:', { targetId, note });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
      return;
    }

    const row = await prisma.user.update({
      where: { id: targetId },
      data: { bonusConversions: { increment: amount } },
      select: { bonusConversions: true },
    });

    res.json({ granted: amount, bonusConversions: row.bonusConversions });
  } catch (e) {
    console.error('[admin/users grant-conversions]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not grant conversions' });
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

    invalidateConfigCache(CONFIG_CACHE_KEYS.TOOLS);

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

router.get('/billing/stats', async (_req: Request, res: Response) => {
  try {
    const activeStatuses = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING];

    const [activeRows, failedPayments, canceledSubscriptions, succeededLast30] =
      await Promise.all([
        prisma.subscription.findMany({
          where: { status: { in: activeStatuses } },
          select: { plan: true, status: true, currentPeriodEnd: true },
        }),
        prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
        prisma.subscription.count({ where: { status: SubscriptionStatus.CANCELED } }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.SUCCEEDED,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          _sum: { amount: true },
        }),
      ]);

    const premiumActive = activeRows.filter((s) =>
      isActivePremium(s.status, s.currentPeriodEnd)
    );
    const mrrEstimateAgorot = premiumActive.reduce(
      (sum, s) => sum + SUBSCRIPTION_MRR_AGOROT[s.plan],
      0
    );

    res.json({
      activeSubscriptions: premiumActive.length,
      canceledSubscriptions,
      failedPayments,
      mrrEstimateAgorot,
      revenueLast30DaysAgorot: succeededLast30._sum.amount ?? 0,
      currency: 'ils',
    });
  } catch (e) {
    console.error('[admin/billing/stats]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load billing stats' });
  }
});

router.get('/billing/payments', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 25));
    const skip = (page - 1) * pageSize;

    const [total, rows] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      payments: rows.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        type: p.type,
        provider: inferPaymentProvider(p),
        userEmail: p.user.email,
        createdAt: p.createdAt,
      })),
    });
  } catch (e) {
    console.error('[admin/billing/payments]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not list payments' });
  }
});

router.get('/billing/subscriptions', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 25));
    const skip = (page - 1) * pageSize;
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';

    const where: Prisma.SubscriptionWhereInput = {};
    if (filter === 'active') {
      where.status = { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] };
    } else if (filter === 'canceled') {
      where.status = SubscriptionStatus.CANCELED;
    } else {
      where.status = {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.CANCELED,
          SubscriptionStatus.PAST_DUE,
          SubscriptionStatus.UNPAID,
        ],
      };
    }

    const [total, rows] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      filter,
      subscriptions: rows.map((s) => ({
        id: s.id,
        userEmail: s.user.email,
        plan: s.plan,
        status: s.status,
        provider: s.paymentProvider,
        isPremium: isActivePremium(s.status, s.currentPeriodEnd),
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (e) {
    console.error('[admin/billing/subscriptions]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not list subscriptions' });
  }
});

router.get('/ads/settings', async (_req: Request, res: Response) => {
  try {
    const row = await ensureAdSettings();
    res.json({ settings: serializeAdSettings(row) });
  } catch (e) {
    respondAdSettingsDbError(res, e, 'admin/ads/settings GET', 'load');
  }
});

router.patch('/ads/settings', async (req: Request, res: Response) => {
  try {
    const { data, error } = parseAdSettingsPatch(req.body as Record<string, unknown>);
    if (error) {
      res.status(400).json({ error: 'INVALID_BODY', message: error });
      return;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'INVALID_BODY', message: 'No fields to update' });
      return;
    }

    const updated = await saveAdSettings(data);
    invalidateConfigCache(CONFIG_CACHE_KEYS.ADS);
    res.json({ settings: serializeAdSettings(updated) });
  } catch (e) {
    respondAdSettingsDbError(res, e, 'admin/ads/settings PATCH', 'save');
  }
});

router.get('/ai/settings', async (_req: Request, res: Response) => {
  try {
    const row = await ensureAiSettings();
    res.json({ settings: serializeAiSettingsAdmin(row) });
  } catch (e) {
    respondAiSettingsDbError(res, e, 'admin/ai/settings GET', 'load');
  }
});

router.patch('/ai/settings', async (req: Request, res: Response) => {
  try {
    const { data, error } = parseAiSettingsPatch(req.body as Record<string, unknown>);
    if (error) {
      res.status(400).json({ error: 'INVALID_BODY', message: error });
      return;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'INVALID_BODY', message: 'No fields to update' });
      return;
    }

    const updated = await saveAiSettings(data);
    res.json({ settings: serializeAiSettingsAdmin(updated) });
  } catch (e) {
    respondAiSettingsDbError(res, e, 'admin/ai/settings PATCH', 'save');
  }
});

router.get('/ai/generations', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
    const skip = (page - 1) * pageSize;
    const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const where: Prisma.AiGenerationLogWhereInput = {};
    if (userId) where.userId = userId;
    if (status === 'SUCCESS' || status === 'FAILED') {
      where.status = status;
    }
    if (search) {
      where.user = { email: { contains: search } };
    }

    const [total, rows, aggregates] = await Promise.all([
      prisma.aiGenerationLog.count({ where }),
      prisma.aiGenerationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
        },
      }),
      prisma.aiGenerationLog.aggregate({
        where: { ...where, status: 'SUCCESS' },
        _sum: { estimatedCostUsd: true, creditsCharged: true },
        _count: { _all: true },
      }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      summary: {
        successCount: aggregates._count._all,
        totalCreditsCharged: aggregates._sum.creditsCharged ?? 0,
        totalCostUsd: aggregates._sum.estimatedCostUsd
          ? Number(aggregates._sum.estimatedCostUsd)
          : 0,
      },
      generations: rows.map((g) => ({
        id: g.id,
        userId: g.userId,
        userEmail: g.user?.email ?? null,
        toolId: g.toolId,
        status: g.status,
        creditsCharged: g.creditsCharged,
        estimatedCostUsd: g.estimatedCostUsd ? Number(g.estimatedCostUsd) : null,
        provider: g.provider,
        model: g.model,
        promptPreview: g.promptPreview,
        errorMessage: g.errorMessage,
        durationMs: g.durationMs,
        createdAt: g.createdAt,
      })),
    });
  } catch (e) {
    console.error('[admin/ai/generations]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not list AI generations' });
  }
});

router.get('/users/:id/ai-stats', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const targetId = typeof rawId === 'string' ? rawId : rawId?.[0];
    if (!targetId) {
      res.status(400).json({ error: 'INVALID_PARAMS', message: 'Missing user id' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true },
    });
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
      return;
    }

    const [aggregates, recent] = await Promise.all([
      prisma.aiGenerationLog.aggregate({
        where: { userId: targetId },
        _sum: { estimatedCostUsd: true, creditsCharged: true },
        _count: { _all: true },
      }),
      prisma.aiGenerationLog.findMany({
        where: { userId: targetId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      userId: user.id,
      email: user.email,
      generationCount: aggregates._count._all,
      totalCreditsCharged: aggregates._sum.creditsCharged ?? 0,
      totalCostUsd: aggregates._sum.estimatedCostUsd
        ? Number(aggregates._sum.estimatedCostUsd)
        : 0,
      recent: recent.map((g) => ({
        id: g.id,
        toolId: g.toolId,
        status: g.status,
        creditsCharged: g.creditsCharged,
        estimatedCostUsd: g.estimatedCostUsd ? Number(g.estimatedCostUsd) : null,
        model: g.model,
        promptPreview: g.promptPreview,
        createdAt: g.createdAt,
      })),
    });
  } catch (e) {
    console.error('[admin/users/:id/ai-stats]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load AI stats' });
  }
});

export default router;

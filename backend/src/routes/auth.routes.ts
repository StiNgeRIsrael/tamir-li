import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { pingDatabase } from '../lib/db-health';
import { requireAuth, getJwtSecret } from '../middleware/auth.middleware';
import { RoleType, Prisma } from '@prisma/client';

const router = Router();

async function grantAdminIfListed(email: string, userId: string): Promise<void> {
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? [];
  if (!adminEmails.includes(email.toLowerCase())) return;
  await prisma.userRole.upsert({
    where: { userId_role: { userId, role: RoleType.ADMIN } },
    create: { userId, role: RoleType.ADMIN },
    update: {},
  });
}

function getGoogleClient(): OAuth2Client {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error('GOOGLE_CLIENT_ID is not set');
  return new OAuth2Client(id);
}

function signAppToken(userId: string): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: '7d' });
}

const userWithRelations = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { profile: true, roles: true },
});

type UserWithRelations = Prisma.UserGetPayload<typeof userWithRelations>;

router.post('/google', async (req: Request, res: Response) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID?.trim()) {
      res.status(503).json({
        error: 'AUTH_MISCONFIGURED',
        message: 'Google sign-in is not configured on the server (GOOGLE_CLIENT_ID missing)',
      });
      return;
    }

    const dbOk = await pingDatabase();
    if (!dbOk) {
      res.status(503).json({
        error: 'DATABASE_UNAVAILABLE',
        message: 'Database is temporarily unavailable. Sign-in requires the database.',
      });
      return;
    }

    const idToken = req.body?.idToken as string | undefined;
    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({ error: 'INVALID_BODY', message: 'idToken required' });
      return;
    }

    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const gp = ticket.getPayload();
    if (!gp) {
      res.status(401).json({ error: 'GOOGLE_VERIFY_FAILED', message: 'Invalid Google token' });
      return;
    }

    const googleSub = gp.sub;
    const email = gp.email?.toLowerCase().trim();
    const emailVerified = gp.email_verified === true;
    if (!email || !googleSub) {
      res.status(400).json({ error: 'MISSING_CLAIMS', message: 'Email or sub missing from Google token' });
      return;
    }
    if (!emailVerified) {
      res.status(403).json({ error: 'EMAIL_NOT_VERIFIED', message: 'Google email must be verified' });
      return;
    }

    const displayName = gp.name ?? email.split('@')[0];
    const avatarUrl = gp.picture ?? null;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleSub }, { email }] },
      include: { profile: true, roles: true },
    });

    let user: UserWithRelations;

    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          email,
          googleSub: existing.googleSub ?? googleSub,
          profile: {
            upsert: {
              where: { id: existing.id },
              create: {
                displayName,
                avatarUrl,
                locale: 'he',
              },
              update: {
                displayName,
                avatarUrl,
              },
            },
          },
        },
        include: { profile: true, roles: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          googleSub,
          passwordHash: null,
          profile: {
            create: {
              displayName,
              avatarUrl,
              locale: 'he',
            },
          },
          roles: {
            create: { role: RoleType.USER },
          },
        },
        include: { profile: true, roles: true },
      });
    }

    const hasUserRole = user.roles.some((r) => r.role === RoleType.USER);
    if (!hasUserRole) {
      await prisma.userRole.create({
        data: { userId: user.id, role: RoleType.USER },
      });
      user = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { profile: true, roles: true },
      });
    }

    await grantAdminIfListed(email, user.id);
    user = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true, roles: true },
    });

    if (user.blocked) {
      res.status(403).json({ error: 'ACCOUNT_BLOCKED', message: 'Account suspended' });
      return;
    }

    const token = signAppToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName ?? displayName,
        avatarUrl: user.profile?.avatarUrl ?? avatarUrl,
        locale: user.profile?.locale ?? 'he',
        roles: user.roles.map((r) => r.role),
        blocked: user.blocked,
      },
    });
  } catch (e) {
    console.error('[auth/google]', e);
    const dbOk = await pingDatabase();
    if (!dbOk) {
      res.status(503).json({
        error: 'DATABASE_UNAVAILABLE',
        message: 'Database is temporarily unavailable. Sign-in requires the database.',
      });
      return;
    }
    res.status(500).json({ error: 'AUTH_FAILED', message: 'Google sign-in failed' });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true, roles: true },
    });
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
      return;
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName,
        avatarUrl: user.profile?.avatarUrl,
        locale: user.profile?.locale ?? 'he',
        roles: user.roles.map((r) => r.role),
        blocked: user.blocked,
      },
    });
  } catch (e) {
    console.error('[auth/me]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load user' });
  }
});

export default router;

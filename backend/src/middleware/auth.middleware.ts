import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error('JWT_SECRET must be set (min 16 chars)');
  }
  return s;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing bearer token' });
      return;
    }
    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & { sub?: string };
    if (!payload.sub) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid payload' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { blocked: true },
    });
    if (!user) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'User no longer exists' });
      return;
    }
    if (user.blocked) {
      res.status(403).json({ error: 'ACCOUNT_BLOCKED', message: 'Account access suspended' });
      return;
    }
    req.userId = payload.sub;
    req.authPayload = payload;
    next();
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired token' });
      return;
    }
    console.error('[requireAuth]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Authentication failed' });
  }
}

/** Sets req.userId when a valid Bearer token is present; otherwise continues anonymously. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) {
      next();
      return;
    }
    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & { sub?: string };
    if (!payload.sub) {
      next();
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { blocked: true },
    });
    if (!user || user.blocked) {
      next();
      return;
    }
    req.userId = payload.sub;
    req.authPayload = payload;
    next();
  } catch {
    next();
  }
}

export { getJwtSecret };

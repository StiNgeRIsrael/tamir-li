import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { RoleType } from '@prisma/client';

export function requireRoles(...allowed: RoleType[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uid = req.userId;
      if (!uid) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
        return;
      }
      const rows = await prisma.userRole.findMany({
        where: { userId: uid, role: { in: allowed } },
      });
      if (rows.length === 0) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Insufficient permissions' });
        return;
      }
      next();
    } catch (e) {
      console.error('[requireRoles]', e);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'Authorization check failed' });
    }
  };
}

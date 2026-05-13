import type { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      authPayload?: JwtPayload & { sub?: string };
    }
  }
}

export {};

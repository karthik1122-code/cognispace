import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'cognispace_secure_dev_jwt_secret_key_2026';

/**
 * JWT Authentication Middleware
 * Enforces valid Bearer token for protected AI endpoints.
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In local dev without active token, attach demo user context for seamless development
    if (process.env.NODE_ENV !== 'production') {
      req.user = {
        id: 'user-demo-101',
        email: 'karthik@antigravity.io',
        role: 'engineer',
      };
      return next();
    }

    res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing or malformed Bearer authorization token',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
      error: err.message,
    });
  }
}

export default authMiddleware;

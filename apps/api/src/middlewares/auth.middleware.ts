import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { UnauthorizedError, ForbiddenError } from '../errors/app.error';
import { Role } from '../repositories/user.repository';

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware: requireAuth
 * Verifies Bearer JWT token from Authorization header and attaches req.user
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication required. Please provide a valid Bearer token.');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new UnauthorizedError('Authentication token is missing.');
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: requireRole
 * Enforces that req.user has one of the required roles
 */
export function requireRole(...allowedRoles: (Role | string)[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required before role verification.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      );
    }

    next();
  };
}


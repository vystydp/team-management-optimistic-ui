/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { User } from '../types/user';

/**
 * Extend Express Request to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware to require authentication on routes
 * Verifies JWT token and attaches user to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Extract token from Authorization header
  const token = authService.extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication token provided',
    });
    return;
  }

  // Verify token
  const payload = authService.verifyToken(token);
  if (!payload) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
    return;
  }

  // Load user from database
  const user = userService.findById(payload.userId);
  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'User not found',
    });
    return;
  }

  // Attach user to request
  req.user = user;
  next();
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for endpoints that have different behavior for authenticated users
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = authService.extractTokenFromHeader(req.headers.authorization);

  if (token) {
    const payload = authService.verifyToken(token);
    if (payload) {
      const user = userService.findById(payload.userId);
      if (user) {
        req.user = user;
      }
    }
  }

  next();
}

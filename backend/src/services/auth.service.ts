import jwt from 'jsonwebtoken';
import { User } from '../types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRATION = '7d'; // Token expires in 7 days

export interface JWTPayload {
  userId: string;
  githubId: string;
  login: string;
}

/**
 * Authentication service for JWT token management
 */
class AuthService {
  /**
   * Generate JWT token for authenticated user
   */
  generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      githubId: user.githubId,
      login: user.login,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
      issuer: 'team-management-api',
    });
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'team-management-api',
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('[AuthService] Token verification failed:', error);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }
}

export const authService = new AuthService();

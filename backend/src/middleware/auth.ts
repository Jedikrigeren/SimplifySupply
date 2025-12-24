import { Context, Next } from '@hono/hono';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { TokenBlacklistModel } from '../models/TokenBlacklist.ts';
import { UserModel } from '../models/User.ts';

export interface AuthPayload {
  userId: string;
  username: string;
  email: string;
}

declare module '@hono/hono' {
  interface ContextVariableMap {
    user: AuthPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized', message: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const jwtSecret = Deno.env.get('JWT_SECRET');

    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return c.json({ error: 'Server configuration error' }, 500);
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, jwtSecret) as AuthPayload;

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklistModel.isBlacklisted(token);
    if (isBlacklisted) {
      return c.json({ error: 'Unauthorized', message: 'Token has been revoked' }, 401);
    }

    // Verify the user still exists and is active
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'User not found' }, 401);
    }

    if (!user.is_active) {
      return c.json({ error: 'Unauthorized', message: 'Account is inactive' }, 401);
    }

    // Set user in context for use in route handlers
    c.set('user', {
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    await next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      return c.json({ error: 'Unauthorized', message: 'Token expired' }, 401);
    }
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

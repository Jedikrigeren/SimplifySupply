import { Hono } from '@hono/hono';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.ts';
import { authRateLimit } from '../middleware/rateLimit.ts';
import { TokenBlacklistModel } from '../models/TokenBlacklist.ts';
import { SessionModel, UserModel } from '../models/User.ts';
import { AuthService } from '../services/auth.service.ts';

export const authRoutes = new Hono();

// Registration schema validation
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
  warehouseLocation: z.string().optional(),
});

// Login schema validation
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Refresh token schema validation
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
authRoutes.post('/register', authRateLimit, async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          error: 'Validation error',
          details: validation.error.issues,
        },
        400
      );
    }

    const result = await AuthService.register(validation.data);

    return c.json({
      success: true,
      message: 'Registration successful',
      data: result,
    }, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return c.json(
          {
            error: 'Registration failed',
            message: error.message,
          },
          409
        );
      }
      if (error.message.includes('Password validation failed')) {
        return c.json(
          {
            error: 'Validation error',
            message: error.message,
          },
          400
        );
      }
    }

    console.error('Registration error:', error);
    return c.json(
      {
        error: 'Internal server error',
        message: 'An error occurred during registration',
      },
      500
    );
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT token
 */
authRoutes.post('/login', authRateLimit, async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          error: 'Validation error',
          details: validation.error.issues,
        },
        400
      );
    }

    const { username, password } = validation.data;

    // Attempt to authenticate
    const result = await AuthService.login({ username, password });

    if (!result) {
      return c.json(
        {
          error: 'Authentication failed',
          message: 'Invalid username or password',
        },
        401
      );
    }

    return c.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Account is inactive') {
      return c.json(
        {
          error: 'Account inactive',
          message: 'Your account has been deactivated. Please contact an administrator.',
        },
        403
      );
    }

    console.error('Login error:', error);
    return c.json(
      {
        error: 'Internal server error',
        message: 'An error occurred during login',
      },
      500
    );
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
authRoutes.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = refreshSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          error: 'Validation error',
          details: validation.error.issues,
        },
        400
      );
    }

    const { refreshToken } = validation.data;

    // Attempt to refresh token
    const result = await AuthService.refreshAccessToken(refreshToken);

    if (!result) {
      return c.json(
        {
          error: 'Authentication failed',
          message: 'Invalid or expired refresh token',
        },
        401
      );
    }

    return c.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json(
      {
        error: 'Internal server error',
        message: 'An error occurred during token refresh',
      },
      500
    );
  }
});

/**
 * POST /api/auth/logout
 * Logout a user, blacklist the access token, and delete refresh tokens
 */
authRoutes.post('/logout', authMiddleware, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7); // Remove 'Bearer ' prefix
    const user = c.get('user');

    // Blacklist the access token
    if (token) {
      const jwtSecret = Deno.env.get('JWT_SECRET');
      if (jwtSecret) {
        const decoded = jwt.decode(token) as jwt.JwtPayload;
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          await TokenBlacklistModel.blacklistToken(token, expiresAt);
        }
      }
    }

    // Delete all refresh tokens for this user
    if (user?.userId) {
      await SessionModel.deleteByUserId(user.userId);
    }

    return c.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Even if blacklisting fails, we can still logout
    return c.json({
      success: true,
      message: 'Logout successful',
    });
  }
});

/**
 * GET /api/auth/me
 * Get the current authenticated user's profile
 */
authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    // Fetch full user details from database
    const userDetails = await UserModel.findById(user.userId);

    if (!userDetails) {
      return c.json(
        {
          error: 'User not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: {
        id: userDetails.id,
        username: userDetails.username,
        email: userDetails.email,
        fullName: userDetails.full_name,
        warehouseLocation: userDetails.warehouse_location,
        isActive: userDetails.is_active,
        createdAt: userDetails.created_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch user profile',
      },
      500
    );
  }
});

/**
 * GET /api/auth/verify
 * Verify if the current token is valid
 */
authRoutes.get('/verify', authMiddleware, (c) => {
  const user = c.get('user');
  
  return c.json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: user.userId,
      username: user.username,
      email: user.email,
    },
  });
});

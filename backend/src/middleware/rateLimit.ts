import { Context, Next } from '@hono/hono';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string;
}

/**
 * Rate limiting middleware to prevent brute force attacks
 * @param options Configuration options
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  const { windowMs, maxRequests, message } = options;

  return async (c: Context, next: Next) => {
    // Get client identifier (IP address + user agent for better uniqueness)
    const clientIP = c.req.header('x-forwarded-for') || 
                     c.req.header('x-real-ip') || 
                     'unknown';
    const userAgent = c.req.header('user-agent') || '';
    const key = `${clientIP}:${userAgent}:${c.req.path}`;

    const now = Date.now();

    // Initialize or get existing rate limit data
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      await next();
      return;
    }

    // Increment request count
    store[key].count++;

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      const resetInSeconds = Math.ceil((store[key].resetTime - now) / 1000);
      
      return c.json(
        {
          error: 'Too many requests',
          message: message || 'Rate limit exceeded. Please try again later.',
          retryAfter: resetInSeconds,
        },
        429
      );
    }

    await next();
  };
}

/**
 * Preset: Strict rate limit for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many login attempts. Please try again after 15 minutes.',
});

/**
 * Preset: Moderate rate limit for general API endpoints
 * 100 requests per 15 minutes
 */
export const apiRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests. Please try again later.',
});

import { cors } from '@hono/cors';
import { Hono } from '@hono/hono';
import 'dotenv/config';
import { authRoutes } from './routes/auth.routes.ts';
import { countingRoutes } from './routes/counting.routes.ts';
import { itemRoutes } from './routes/item.routes.ts';
import { initializeSAPCache } from './sap/init.ts';

const app = new Hono();

// CORS middleware
const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:8081'];
const isDevelopment = Deno.env.get('NODE_ENV') !== 'production';
app.use('/*', cors({
  origin: isDevelopment ? '*' : allowedOrigins,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/items', itemRoutes);
app.route('/api/counting-sessions', countingRoutes);

// API routes will be added here
app.get('/api', (c) => {
  return c.json({
    message: 'Warehouse Helper API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      items: '/api/items/*',
      counting: '/api/counting-sessions/*',
    },
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err);
  return c.json({
    error: 'Internal Server Error',
    message: Deno.env.get('NODE_ENV') === 'development' ? err.message : 'Something went wrong',
  }, 500);
});

const PORT = parseInt(Deno.env.get('PORT') || '3000');
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Initialize SAP cache (runs in background)
// Default warehouse code can be configured via env variable
const defaultWarehouse = Deno.env.get('SAP_DEFAULT_WAREHOUSE') || '01';
try {
  initializeSAPCache(defaultWarehouse);
} catch (err) {
  console.error('SAP cache initialization error:', err);
}

// Start server
Deno.serve({ port: PORT, hostname: HOST }, app.fetch);

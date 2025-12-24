import { cors } from '@hono/cors';
import { Hono } from '@hono/hono';
import 'dotenv/config';

const app = new Hono();

// CORS middleware
const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:8081'];
app.use('/*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Basic logging middleware
app.use('/*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${c.res.status} (${ms}ms)`);
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be added here
app.get('/api', (c) => {
  return c.json({
    message: 'Warehouse Helper API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      sap: '/api/sap/*',
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

console.log(`🚀 Server starting on port ${PORT}...`);
console.log(`📝 Environment: ${Deno.env.get('NODE_ENV') || 'development'}`);

// Start server
Deno.serve({ port: PORT }, app.fetch);

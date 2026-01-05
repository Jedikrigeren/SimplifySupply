import 'dotenv/config';
import knex from 'knex';

// Debug: Log the connection config
const connectionConfig = {
  host: Deno.env.get('DB_HOST') || 'localhost',
  port: parseInt(Deno.env.get('DB_PORT') || '5432'),
  database: Deno.env.get('DB_NAME') || 'simplify_supply',
  user: Deno.env.get('DB_USER') || 'testUser',
  password: Deno.env.get('DB_PASSWORD') || 'testPassword',
};

console.log('Database connection config:', {
  ...connectionConfig,
  password: '***' // Hide password in logs
});

const config = {
  client: 'pg',
  connection: connectionConfig,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

export const db = knex(config);

export default config;

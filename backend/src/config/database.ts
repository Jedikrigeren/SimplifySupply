import 'dotenv/config';
import knex from 'knex';

const config = {
  client: 'pg',
  connection: {
    host: Deno.env.get('DB_HOST') || 'localhost',
    port: parseInt(Deno.env.get('DB_PORT') || '5432'),
    database: Deno.env.get('DB_NAME') || 'warehouse_helper',
    user: Deno.env.get('DB_USER') || 'postgres',
    password: Deno.env.get('DB_PASSWORD') || '',
  },
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

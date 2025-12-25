import knex from 'knex';
import config from './database.ts';

const db = knex(config);

await db.migrate.latest();

await db.destroy();
Deno.exit(0);

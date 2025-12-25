import knex from 'knex';
import config from './database.ts';

const db = knex(config);

await db.seed.run();

await db.destroy();
Deno.exit(0);

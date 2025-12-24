import knex from 'knex';
import config from './database.ts';

const db = knex(config);

console.log('Running migrations...');
await db.migrate.latest();
console.log('Migrations completed successfully!');

await db.destroy();
Deno.exit(0);

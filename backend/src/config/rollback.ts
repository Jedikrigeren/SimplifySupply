import knex from 'knex';
import config from './database.ts';

const db = knex(config);

console.log('Rolling back last migration...');
await db.migrate.rollback();
console.log('Rollback completed successfully!');

await db.destroy();
Deno.exit(0);

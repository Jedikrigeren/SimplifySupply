import knex from 'knex';
import config from './database.ts';

const db = knex(config);

console.log('Running seeds...');
await db.seed.run();
console.log('Seeds completed successfully!');

await db.destroy();
Deno.exit(0);

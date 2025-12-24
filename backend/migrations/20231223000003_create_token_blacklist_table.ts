import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('token_blacklist', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('token_hash', 255).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Add index for faster lookups
    table.index(['token_hash', 'expires_at']);
  });

  console.log('✓ Created token_blacklist table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('token_blacklist');
}

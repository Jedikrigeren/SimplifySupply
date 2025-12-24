import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('token_hash');
  });

  console.log('✓ Created user_sessions table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_sessions');
}

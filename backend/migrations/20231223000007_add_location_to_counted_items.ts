import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('counted_items', (table) => {
    table.string('location', 100); // Location where the item was counted
  });
  console.log('✓ Added location column to counted_items table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('counted_items', (table) => {
    table.dropColumn('location');
  });
}

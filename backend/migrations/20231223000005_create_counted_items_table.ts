import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('counted_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('session_id').notNullable().references('id').inTable('counting_sessions').onDelete('CASCADE');
    table.string('item_code', 50).notNullable();
    table.decimal('counted_quantity', 12, 2).notNullable();
    table.string('counted_uom', 20).notNullable(); // The UoM used when counting
    table.string('warehouse_code', 10).notNullable();
    table.timestamp('counted_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('session_id');
    table.index('item_code');
    table.index(['session_id', 'item_code']); // Unique within session
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('counted_items');
}

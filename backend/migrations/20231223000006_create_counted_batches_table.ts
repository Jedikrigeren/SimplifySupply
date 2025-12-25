import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('counted_batches', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('counted_item_id').notNullable().references('id').inTable('counted_items').onDelete('CASCADE');
    table.string('batch_number', 50).notNullable();
    table.decimal('counted_quantity', 12, 2).notNullable(); // In InventoryUoM
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('counted_item_id');
    table.index('batch_number');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('counted_batches');
}

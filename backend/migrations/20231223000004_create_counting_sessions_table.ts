import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('counting_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('warehouse_code', 10).notNullable();
    table.enum('status', ['active', 'paused', 'completed', 'submitted']).notNullable().defaultTo('active');
    table.string('session_reference', 100); // For SAP submission tracking
    table.integer('sap_doc_entry'); // SAP document entry number after submission
    table.integer('sap_doc_num'); // SAP document number after submission
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('paused_at');
    table.timestamp('completed_at');
    table.timestamp('submitted_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('warehouse_code');
    table.index('status');
    table.index(['user_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('counting_sessions');
}

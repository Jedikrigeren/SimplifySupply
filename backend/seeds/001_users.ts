import * as bcrypt from 'bcrypt';
import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex('user_sessions').del();
  await knex('users').del();

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@warehouse.com',
      password_hash: hashedPassword,
      full_name: 'Admin User',
      warehouse_location: 'Main Warehouse',
      is_active: true,
    },
    {
      username: 'worker1',
      email: 'worker1@warehouse.com',
      password_hash: hashedPassword,
      full_name: 'John Worker',
      warehouse_location: 'Main Warehouse',
      is_active: true,
    },
    {
      username: 'worker2',
      email: 'worker2@warehouse.com',
      password_hash: hashedPassword,
      full_name: 'Jane Worker',
      warehouse_location: 'North Warehouse',
      is_active: true,
    },
  ]);

  console.log('✓ Seeded test users (password: password123)');
}

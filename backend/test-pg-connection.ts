import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'simplify_supply',
  user: 'testUser',
  password: 'testPassword',
});

try {
  console.log('Attempting to connect...');
  await client.connect();
  console.log('Connected successfully!');
  
  const res = await client.query('SELECT current_user, current_database(), version()');
  console.log('Query result:', res.rows[0]);
  
  await client.end();
  console.log('Connection closed.');
} catch (err) {
  console.error('Connection error:', err);
  Deno.exit(1);
}

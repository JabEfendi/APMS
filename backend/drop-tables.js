const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  // Get all table names
  const result = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `);

  const tables = result.rows.map(row => row.tablename);

  if (tables.length === 0) {
    console.log('No tables to drop.');
    await pool.end();
    return;
  }

  console.log('Dropping tables:', tables.join(', '));

  // Drop all tables with CASCADE
  for (const table of tables) {
    await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
  }

  console.log('All tables dropped!');
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

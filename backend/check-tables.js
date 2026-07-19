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

  console.log('Tables in database:');
  for (const table of tables) {
    // Get row count
    const countResult = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
    const rowCount = countResult.rows[0].count;
    console.log(`- ${table}: ${rowCount} rows`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

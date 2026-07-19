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
  console.log('Cleaning up DATA_INQUIRY...');
  
  // Delete rows where LEGEND column is not null
  const result = await pool.query(`
    DELETE FROM "DATA_INQUIRY" 
    WHERE "LEGEND___CARA_INPUT___PART_VENDOR_PRICE" IS NOT NULL
  `);
  
  console.log(`Deleted ${result.rowCount} LEGEND rows from DATA_INQUIRY`);
  
  // Check remaining rows
  const countResult = await pool.query('SELECT COUNT(*) FROM "DATA_INQUIRY"');
  console.log(`Remaining rows in DATA_INQUIRY: ${countResult.rows[0].count}`);
  
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

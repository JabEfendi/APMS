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
  console.log('Dropping legend columns from DATA_INQUIRY...');
  
  // List of columns to drop
  const columnsToDrop = [
    'column_35',
    '_1',
    'LEGEND___CARA_INPUT___PART_VENDOR_PRICE',
    '_2',
    '_3'
  ];
  
  for (const column of columnsToDrop) {
    try {
      await pool.query(`ALTER TABLE "DATA_INQUIRY" DROP COLUMN IF EXISTS "${column}"`);
      console.log(`Dropped column: ${column}`);
    } catch (err) {
      console.warn(`Could not drop column ${column}:`, err.message);
    }
  }
  
  console.log('Done!');
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

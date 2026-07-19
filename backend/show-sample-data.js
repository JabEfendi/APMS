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
  console.log('Sample data from DATA_INQUIRY (first 5 rows):');
  const result = await pool.query('SELECT * FROM "DATA_INQUIRY" LIMIT 5');
  
  result.rows.forEach((row, index) => {
    console.log(`\nRow ${index + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      if (key !== 'id') {
        console.log(`  ${key}: ${value}`);
      }
    });
  });

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

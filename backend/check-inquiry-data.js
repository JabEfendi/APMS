
require('dotenv').config();
const pool = require('./db');

async function checkData() {
  try {
    const result = await pool.query(`SELECT "Inquiry_ID", "Customer_Name", "Brand", "Part_Number", "Data_Status" FROM "DATA_INQUIRY" ORDER BY id ASC LIMIT 20`);
    console.log('Current DATA_INQUIRY sample:');
    console.table(result.rows);
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkData();

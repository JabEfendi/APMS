
require('dotenv').config();
const pool = require('./db');

async function checkColumns() {
  try {
    // Check VENDOR_PRICE columns
    const vendorPriceColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'VENDOR_PRICE'
    `);
    console.log('VENDOR_PRICE columns:');
    vendorPriceColumns.rows.forEach(row => console.log(`- ${row.column_name}`));

    // Check DATA_INQUIRY columns
    const dataInquiryColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'DATA_INQUIRY'
    `);
    console.log('\nDATA_INQUIRY columns:');
    dataInquiryColumns.rows.forEach(row => console.log(`- ${row.column_name}`));

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkColumns();


require('dotenv').config();
const pool = require('./db');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful!');
    console.log('Current time from DB:', result.rows[0].now);
    
    // Test querying DATA_INQUIRY
    const inquiryResult = await pool.query('SELECT COUNT(*) FROM "DATA_INQUIRY"');
    console.log('Total inquiries in DB:', inquiryResult.rows[0].count);
    
    // Test querying VENDOR_PRICE
    const vendorPriceResult = await pool.query('SELECT COUNT(*) FROM "VENDOR_PRICE"');
    console.log('Total vendor prices in DB:', vendorPriceResult.rows[0].count);
    
    await pool.end();
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

testConnection();

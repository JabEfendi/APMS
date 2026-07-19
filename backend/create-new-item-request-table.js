
require('dotenv').config();
const pool = require('./db');

async function createNewItemRequestTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS new_item_requests (
        id SERIAL PRIMARY KEY,
        request_number VARCHAR(255) NOT NULL,
        part_no VARCHAR(255),
        part_name VARCHAR(255),
        brand VARCHAR(255),
        vin VARCHAR(255),
        status VARCHAR(255) DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(createTableQuery);
    console.log('New Item Requests table created successfully');
    await pool.end();
  } catch (err) {
    console.error('Error creating table:', err);
    process.exit(1);
  }
}

createNewItemRequestTable();

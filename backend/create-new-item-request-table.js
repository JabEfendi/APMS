
require('dotenv').config();
const pool = require('./db');

async function createNewItemRequestTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS new_item_requests (
        id SERIAL PRIMARY KEY,
        request_number VARCHAR(255) NOT NULL,
        inquiry_id VARCHAR(255),
        customer VARCHAR(255),
        part_no VARCHAR(255),
        part_name VARCHAR(255),
        brand VARCHAR(255),
        model VARCHAR(255),
        series_type VARCHAR(255),
        year VARCHAR(50),
        workshop_name VARCHAR(255),
        vin VARCHAR(255),
        data_status VARCHAR(255),
        vendor_id VARCHAR(255),
        vendor_name VARCHAR(255),
        category_part VARCHAR(255),
        currency VARCHAR(50),
        atpm_price VARCHAR(255),
        cost_price VARCHAR(255),
        hpp_idr VARCHAR(255),
        update_date VARCHAR(50),
        item_image_url TEXT,
        item_image_name VARCHAR(255),
        item_image_mime_type VARCHAR(255),
        attachment_url TEXT,
        attachment_name VARCHAR(255),
        attachment_mime_type VARCHAR(255),
        notes TEXT,
        status_reason TEXT,
        progress_notes TEXT,
        status_id VARCHAR(255),
        po_process VARCHAR(255),
        po_number VARCHAR(255),
        po_date VARCHAR(50),
        status VARCHAR(255) DEFAULT 'validation',
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

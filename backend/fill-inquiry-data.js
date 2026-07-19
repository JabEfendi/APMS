
require('dotenv').config();
const pool = require('./db');

async function fillData() {
  try {
    // First, get all rows ordered by id
    const selectResult = await pool.query(`SELECT id, "Inquiry_ID", "Customer_Name", "Brand", "Model" FROM "DATA_INQUIRY" ORDER BY id ASC`);
    const rows = selectResult.rows;
    
    let lastInquiryID = null;
    let lastCustomerName = null;
    let lastBrand = null;
    let lastModel = null;

    const updates = [];

    for (const row of rows) {
      if (row.Inquiry_ID !== null) lastInquiryID = row.Inquiry_ID;
      if (row.Customer_Name !== null) lastCustomerName = row.Customer_Name;
      if (row.Brand !== null) lastBrand = row.Brand;
      if (row.Model !== null) lastModel = row.Model;

      // Check if we need to update this row
      if (
        row.Inquiry_ID === null || 
        row.Customer_Name === null || 
        row.Brand === null || 
        row.Model === null
      ) {
        updates.push({
          id: row.id,
          Inquiry_ID: row.Inquiry_ID !== null ? row.Inquiry_ID : lastInquiryID,
          Customer_Name: row.Customer_Name !== null ? row.Customer_Name : lastCustomerName,
          Brand: row.Brand !== null ? row.Brand : lastBrand,
          Model: row.Model !== null ? row.Model : lastModel
        });
      }
    }

    // Perform updates
    for (const update of updates) {
      await pool.query(`
        UPDATE "DATA_INQUIRY" 
        SET "Inquiry_ID" = $1, "Customer_Name" = $2, "Brand" = $3, "Model" = $4 
        WHERE id = $5
     `, [update.Inquiry_ID, update.Customer_Name, update.Brand, update.Model, update.id]);
    }

    console.log(`Successfully updated ${updates.length} rows!`);

    // Verify the result
    const verifyResult = await pool.query(`SELECT id, "Inquiry_ID", "Customer_Name", "Brand", "Part_Number", "Data_Status" FROM "DATA_INQUIRY" ORDER BY id ASC LIMIT 20`);
    console.log('Verified DATA_INQUIRY sample:');
    console.table(verifyResult.rows);

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

fillData();

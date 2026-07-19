const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Function to sanitize table name
function sanitizeTableName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

// Function to guess PostgreSQL data type from value
function guessDataType(value) {
  // Just use TEXT for all columns to avoid type errors!
  return 'TEXT';
}

function normalizeHeaders(rawHeaders) {
  const headerCounts = new Map();

  return rawHeaders.map((header, index) => {
    const trimmedHeader = (header || '').toString().trim();
    const baseHeader = trimmedHeader || `column_${index + 1}`;
    const seenCount = headerCounts.get(baseHeader) || 0;

    headerCounts.set(baseHeader, seenCount + 1);

    return seenCount === 0 ? baseHeader : `${baseHeader}_${seenCount}`;
  });
}

// Function to create table from CSV headers and sample data
async function createTableFromCSV(tableName, headers, sampleData) {
  // Guess data types for each column
  const columns = headers.map((header, index) => {
    const sanitizedHeader = sanitizeTableName(header);
    // Collect sample values from first 5 rows to guess data type
    const sampleValues = sampleData.slice(0, 5).map(row => row[index]);
    // Guess type from first non-empty value
    const dataType = sampleValues.find(v => v) ? guessDataType(sampleValues.find(v => v)) : 'TEXT';
    return `"${sanitizedHeader}" ${dataType}`;
  }).join(', ');

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS "${sanitizeTableName(tableName)}" (
      id SERIAL PRIMARY KEY,
      ${columns}
    )
  `;

  await pool.query(createTableQuery);
  console.log(`Table "${sanitizeTableName(tableName)}" created or already exists`);
}

// Function to import CSV data into table
async function importCSVData(tableName, headers, data) {
  const sanitizedTableName = sanitizeTableName(tableName);
  const sanitizedHeaders = headers.map(h => `"${sanitizeTableName(h)}"`);
  const placeholders = headers.map((_, i) => `$${i + 1}`).join(', ');

  const insertQuery = `
    INSERT INTO "${sanitizedTableName}" (${sanitizedHeaders.join(', ')})
    VALUES (${placeholders})
  `;

  // Insert data in batches of 100
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    for (const row of batch) {
      // Handle empty values as null
      const values = row.map(v => v === '' ? null : v);
      await pool.query(insertQuery, values);
    }
    console.log(`Imported ${Math.min(i + batchSize, data.length)} rows into "${sanitizedTableName}"`);
  }
}

// List of files with complex structure to skip for now
const complexFiles = [
  'DATA_BA.csv',
  'TITIP BENTAR.csv',
  'Quotation_Generator.csv',
  'Cost_Saving_calculator.csv',
  'Final_DATA_SELLING_ATPM_&_N-ATPM.csv',
  'Unit_Cherry_March.csv'
];

async function main() {
  const dataDir = path.join(__dirname, 'data');
  
  // Check if data directory exists
  if (!fs.existsSync(dataDir)) {
    console.log('Data directory not found. Please create "backend/data" folder and put your CSV files there.');
    process.exit(1);
  }

  // Get all CSV files in data directory
  let files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));

  // Filter out complex files
  files = files.filter(file => !complexFiles.includes(file));

  if (files.length === 0) {
    console.log('No simple CSV files found in "backend/data" folder.');
    process.exit(1);
  }

  console.log(`Found ${files.length} simple CSV file(s):`);
  files.forEach(file => console.log(`- ${file}`));
  console.log(`\nSkipping complex files: ${complexFiles.join(', ')}`);

  for (const file of files) {
    const tableName = path.basename(file, '.csv');
    const filePath = path.join(dataDir, file);
    
    console.log(`\nProcessing ${file}...`);

    // Read and parse CSV
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const result = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: 'greedy'
    });

    if (result.errors.length > 0) {
      console.warn(`Warnings while parsing ${file}:`, result.errors);
    }

    const rows = result.data || [];
    if (rows.length === 0) {
      console.log(`No rows found in ${file}, skipping...`);
      continue;
    }

    const headers = normalizeHeaders(rows[0]);
    let data = rows.slice(1).map(row => headers.map((_, index) => row[index] ?? null));

    // Clean data: remove rows where all values are empty or contain "LEGEND"
    data = data.filter(row => {
      const isAllEmpty = row.every(cell => cell === null || cell === undefined || cell === '');
      const hasLegend = row.some(cell => cell && cell.toString().includes('LEGEND'));
      return !isAllEmpty && !hasLegend;
    });

    if (headers.length === 0) {
      console.log(`No headers found in ${file}, skipping...`);
      continue;
    }

    // Create table
    await createTableFromCSV(tableName, headers, data);

    // Import data
    if (data.length > 0) {
      await importCSVData(tableName, headers, data);
    } else {
      console.log(`No data found in ${file}`);
    }
  }

  await pool.end();
  console.log('\nImport completed!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const pool = require('./db');

async function migrateSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const statements = schema
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  try {
    console.log('Running schema migration...');

    for (const statement of statements) {
      await pool.query(statement);
    }

    console.log('Schema migration completed successfully.');
  } catch (err) {
    console.error('Schema migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrateSchema();

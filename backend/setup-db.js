const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// First, connect to postgres database to create our apms database
const adminPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'postgres',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupDatabase() {
  try {
    console.log('Creating database...');
    await adminPool.query('CREATE DATABASE apms');
    console.log('Database created successfully');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database already exists');
    } else {
      console.error('Error creating database:', err);
      throw err;
    }
  }

  // Now connect to our apms database
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('Running schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into statements and execute them
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    console.log('Schema executed successfully');
  } catch (err) {
    console.error('Error running schema:', err);
    throw err;
  } finally {
    await adminPool.end();
    await pool.end();
  }
}

setupDatabase();

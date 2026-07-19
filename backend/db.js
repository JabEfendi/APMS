const { Pool } = require('pg');
require('dotenv').config();

const shouldUseSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

module.exports = pool;

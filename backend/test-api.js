const pool = require('./db');

async function test() {
  try {
    const result = await pool.query('SELECT * FROM "DATA_INQUIRY" ORDER BY id DESC LIMIT 1');
    console.log('First inquiry from DB:', result.rows[0]);
    await pool.end();
  } catch (err) {
    console.error(err);
  }
}

test();
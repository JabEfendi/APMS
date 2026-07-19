const { Client } = require("pg");
const client = new Client({
  connectionString: "postgresql://postgres:Mahatahu@db.cflvbakjquzeqbhmmvgq.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 7000,
});
(async () => {
  try {
    await client.connect();
    const result = await client.query("SELECT 1 AS ok");
    console.log(JSON.stringify(result.rows[0]));
  } catch (error) {
    console.error(error.code || "", error.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
})();

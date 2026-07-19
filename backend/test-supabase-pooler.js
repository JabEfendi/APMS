const { Client } = require("pg");
const ref = "cflvbakjquzeqbhmmvgq";
const password = "Mahatahu";
const regions = ["ap-southeast-1","ap-southeast-2","ap-northeast-1","ap-south-1","us-east-1","us-west-1","eu-west-1","eu-central-1"];
(async () => {
  for (const region of regions) {
    const connectionString = `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      const result = await client.query("SELECT 1 AS ok");
      console.log(`SUCCESS ${region} ${JSON.stringify(result.rows[0])}`);
      await client.end();
      process.exit(0);
    } catch (error) {
      console.log(`FAIL ${region} ${error.code || ""} ${error.message}`);
      try { await client.end(); } catch {}
    }
  }
  process.exit(1);
})();

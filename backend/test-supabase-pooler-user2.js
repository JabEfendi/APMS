const { Client } = require("pg");
const password = "Mahatahu";
const regions = [
  "ap-northeast-1","ap-northeast-2","ap-south-1","ap-southeast-1","ap-southeast-2",
  "ca-central-1","eu-central-1","eu-west-1","eu-west-2","eu-west-3",
  "sa-east-1","us-east-1","us-west-1","us-west-2"
];
(async () => {
  for (const region of regions) {
    for (const port of [5432, 6543]) {
      const connectionString = `postgresql://postgres:${password}@aws-0-${region}.pooler.supabase.com:${port}/postgres`;
      const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 4000 });
      try {
        await client.connect();
        const result = await client.query("SELECT 1 AS ok");
        console.log(`SUCCESS ${region}:${port} ${JSON.stringify(result.rows[0])}`);
        await client.end();
        process.exit(0);
      } catch (error) {
        console.log(`FAIL ${region}:${port} ${error.code || ""} ${error.message}`);
        try { await client.end(); } catch {}
      }
    }
  }
  process.exit(1);
})();

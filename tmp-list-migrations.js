require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  const cols = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='_prisma_migrations'
    ORDER BY ordinal_position
  `);
  console.log('Columns:', cols.rows.map(r => r.column_name).join(', '));

  const rows = await client.query(`
    SELECT migration_name, finished_at, rolled_back_at, checksum
    FROM "_prisma_migrations"
    ORDER BY started_at
  `);
  for (const row of rows.rows) {
    const status = row.rolled_back_at ? 'ROLLED_BACK' : row.finished_at ? 'APPLIED' : 'PENDING';
    console.log(`${row.migration_name} | ${status} | checksum=${row.checksum}`);
  }
  await client.end();
})().catch((err) => { console.error(err); process.exit(1); });

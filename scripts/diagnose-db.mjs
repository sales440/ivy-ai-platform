import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Check ivy_clients
  const [clients] = await conn.query('SELECT * FROM ivy_clients LIMIT 10');
  console.log('=== IVY_CLIENTS ===');
  console.log('Count:', clients.length);
  clients.forEach(c => console.log(JSON.stringify(c)));
  
  // Check sales_campaigns
  const [campaigns] = await conn.query('SELECT * FROM sales_campaigns LIMIT 10');
  console.log('\n=== SALES_CAMPAIGNS ===');
  console.log('Count:', campaigns.length);
  campaigns.forEach(c => console.log(JSON.stringify(c)));
  
  // Check ropa_config for companies
  const [config] = await conn.query("SELECT * FROM ropa_config WHERE `key` LIKE '%company%' OR `key` LIKE '%client%' OR `key` LIKE '%empresa%' LIMIT 10");
  console.log('\n=== ROPA_CONFIG (company-related) ===');
  console.log('Count:', config.length);
  config.forEach(c => console.log(JSON.stringify(c)));
  
  // Check all ropa_config keys
  const [allConfig] = await conn.query("SELECT `key`, LEFT(CAST(`value` AS CHAR), 200) as val_preview FROM ropa_config LIMIT 30");
  console.log('\n=== ALL ROPA_CONFIG KEYS ===');
  allConfig.forEach(c => console.log(c.key, ':', c.val_preview));

  // Check client_leads
  const [leads] = await conn.query('SELECT COUNT(*) as cnt FROM client_leads');
  console.log('\n=== CLIENT_LEADS COUNT ===');
  console.log(leads[0].cnt);

  // Check what tables have data
  const tables = ['ivy_clients', 'sales_campaigns', 'client_leads', 'ropa_config', 'ropa_tasks', 'ropa_chat_history'];
  console.log('\n=== TABLE ROW COUNTS ===');
  for (const t of tables) {
    const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM ${t}`);
    console.log(`${t}: ${rows[0].cnt} rows`);
  }
  
  await conn.end();
}
main().catch(e => console.error(e));

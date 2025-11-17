import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('🔧 Connecting to database...');
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Check if notifications table exists
    console.log('🔍 Checking if notifications table exists...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'notifications'");
    
    if (tables.length > 0) {
      console.log('✅ notifications table already exists');
    } else {
      console.log('📦 Creating notifications table...');
      const sqlPath = path.join(__dirname, 'create-notifications-table.sql');
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      await connection.query(sql);
      console.log('✅ notifications table created successfully');
    }
    
    // Verify table structure
    console.log('\n📋 Table structure:');
    const [columns] = await connection.query("DESCRIBE notifications");
    console.table(columns);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n✅ Done!');
  }
}

main();

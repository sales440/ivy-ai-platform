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
    // Check if FAGOR tables exist
    console.log('🔍 Checking if FAGOR tables exist...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'fagorContacts'");
    
    if (tables.length > 0) {
      console.log('✅ FAGOR tables already exist');
    } else {
      console.log('📦 Creating FAGOR tables...');
      const sqlPath = path.join(__dirname, 'create-fagor-tables.sql');
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      
      // Remove comments and split by semicolon
      const sqlWithoutComments = sql.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      const statements = sqlWithoutComments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.query(statement);
          } catch (err) {
            // Ignore "already exists" errors
            if (!err.message.includes('already exists')) {
              throw err;
            }
          }
        }
      }
      
      console.log('✅ FAGOR tables created successfully');
    }
    
    // Verify tables exist
    console.log('\n📋 Verifying FAGOR tables:');
    const [fagorTables] = await connection.query("SHOW TABLES LIKE 'fagor%'");
    console.table(fagorTables);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n✅ Done!');
  }
}

main();

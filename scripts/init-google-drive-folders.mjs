#!/usr/bin/env node
import { createFolderStructure } from '../dist/server/google-drive-sync.js';

/**
 * Initialize Google Drive folder structure
 * Run this after connecting Google Drive OAuth
 */
async function main() {
  console.log('🚀 Initializing Google Drive folder structure...\n');
  
  try {
    const result = await createFolderStructure();
    
    if (result.success) {
      console.log('✅ Folder structure created successfully!\n');
      console.log('📁 Created folders:');
      result.folders.forEach(folder => {
        console.log(`   - ${folder}`);
      });
    } else {
      console.error('❌ Failed to create folder structure:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

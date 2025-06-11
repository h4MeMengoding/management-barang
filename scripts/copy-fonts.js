#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function copyFonts() {
  const sourceDir = path.join(__dirname, '..', 'public', 'fonts');
  const targetDirs = [
    path.join(__dirname, '..', '.next', 'static', 'fonts'),
    path.join(__dirname, '..', '.next', 'server', 'static', 'fonts'),
    path.join(__dirname, '..', 'dist', 'public', 'fonts')
  ];
  
  try {
    console.log('📁 Copying fonts from:', sourceDir);
    
    // Check if source exists
    if (!await fs.pathExists(sourceDir)) {
      console.error('❌ Source font directory does not exist:', sourceDir);
      return;
    }
    
    // Copy to all target directories
    for (const targetDir of targetDirs) {
      try {
        await fs.ensureDir(targetDir);
        await fs.copy(sourceDir, targetDir, { overwrite: true });
        console.log('✅ Fonts copied to:', targetDir);
      } catch (error) {
        console.log('⚠️  Failed to copy to:', targetDir, error.message);
      }
    }
    
    // List copied files
    const files = await fs.readdir(sourceDir);
    console.log('📝 Font files copied:', files.join(', '));
    
  } catch (error) {
    console.error('❌ Error copying fonts:', error);
    process.exit(1);
  }
}

copyFonts();

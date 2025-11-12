const fs = require('fs');
const path = require('path');

// Daftar emoticon yang akan dihapus
const emoticons = [
  '✅',
  '❌', 
  '⚠️',
  '📄',
  '📊',
  '📝',
  '🎯',
  '💪',
  '🚀',
  '📋',
  '🔍',
  '📸',
  '🎉',
  '💡',
  '✨',
  '😊'
];

// File-file yang akan diproses
const files = [
  'app/dashboard/petugas-lapangan/inspeksi/plaza/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/derek/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/kamtib/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/rescue/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/[id]/page.tsx'
];

let totalReplacements = 0;

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping (not found): ${filePath}`);
    return;
  }

  console.log(`\n📝 Processing: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let replacements = 0;
  
  emoticons.forEach(emoticon => {
    const regex = new RegExp(emoticon, 'g');
    const matches = content.match(regex);
    if (matches) {
      replacements += matches.length;
      content = content.replace(regex, '');
    }
  });
  
  if (replacements > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✓ Removed ${replacements} emoticons`);
    totalReplacements += replacements;
  } else {
    console.log(`   - No emoticons found`);
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ DONE! Total emoticons removed: ${totalReplacements}`);
console.log(`${'='.repeat(50)}\n`);

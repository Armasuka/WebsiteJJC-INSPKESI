const fs = require('fs');
const path = require('path');

// File-file yang akan diproses
const files = [
  'app/dashboard/petugas-lapangan/inspeksi/plaza/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/derek/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/kamtib/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/rescue/page.tsx'
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
  
  // Pattern replacements
  const patterns = [
    // Hapus ??? dari heading
    { from: /"\?\?\?\s+/g, to: '"' },
    // Hapus ?? dari heading
    { from: /"\?\?\s+/g, to: '"' },
    // Hapus ??? dari tombol
    { from: />\?\?\?\s+/g, to: '>' },
    // Hapus ?? dari tombol
    { from: />\?\?\s+/g, to: '>' }
  ];
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern.from);
    if (matches) {
      replacements += matches.length;
      content = content.replace(pattern.from, pattern.to);
    }
  });
  
  if (replacements > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✓ Removed ${replacements} question marks`);
    totalReplacements += replacements;
  } else {
    console.log(`   - No question marks found`);
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ DONE! Total question marks removed: ${totalReplacements}`);
console.log(`${'='.repeat(50)}\n`);

const fs = require('fs');
const path = require('path');

// File-file yang akan diproses
const files = [
  'app/dashboard/petugas-lapangan/inspeksi/plaza/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/derek/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/kamtib/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/rescue/page.tsx',
  'app/dashboard/petugas-lapangan/inspeksi/[id]/page.tsx'
];

let totalFixes = 0;

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return;
  }

  console.log(`📝 Cleaning: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let fixes = 0;
  
  // Fix leading spaces after emoticon removal in options
  const patterns = [
    { from: /value="BAIK"> Baik<\/option>/g, to: 'value="BAIK">Baik</option>' },
    { from: /value="RUSAK_RINGAN"> Rusak Ringan<\/option>/g, to: 'value="RUSAK_RINGAN">Rusak Ringan</option>' },
    { from: /value="RUSAK_BERAT"> Rusak Berat<\/option>/g, to: 'value="RUSAK_BERAT">Rusak Berat</option>' },
    // Fix headings with leading spaces
    { from: /"📄 /g, to: '"' },
    { from: /"📊 /g, to: '"' },
    { from: /"📝 /g, to: '"' },
    // Fix labels
    { from: /"✅ /g, to: '"' },
    { from: /"❌ /g, to: '"' },
    // Clean any remaining double spaces
    { from: />  </g, to: '> ' }
  ];
  
  patterns.forEach(pattern => {
    if (content.includes(pattern.from.source ? content.match(pattern.from) : pattern.from)) {
      content = content.replace(pattern.from, pattern.to);
      fixes++;
    }
  });
  
  if (fixes > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✓ Cleaned ${fixes} patterns\n`);
    totalFixes += fixes;
  } else {
    console.log(`   - Already clean\n`);
  }
});

console.log(`✅ DONE! Total patterns cleaned: ${totalFixes}\n`);

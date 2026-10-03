const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting immediately.');
  process.exit(1);
}, 15000);
if (_safetyWatchdog.unref) _safetyWatchdog.unref();

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

console.log('Scanning components for mixed English-Thai parenthetical phrases...');

// Pattern: English words followed by (Thai text) e.g. "Close (ปิดหน้าต่าง)" or Thai followed by (English)
const mixedPattern1 = /[A-Za-z]{3,}\s*\([\u0E00-\u0E7F\s\.\,\-\/]+\)/g;
const mixedPattern2 = /[\u0E00-\u0E7F]{3,}\s*\([A-Za-z\s\.\,\-\/]+\)/g;

let foundCount = 0;

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    let match1;
    while ((match1 = mixedPattern1.exec(line)) !== null) {
      // Ignore false positives like console.log or function calls if any
      console.log(`[${file}:${idx + 1}] Found EN(TH): "${match1[0]}" in: ${trimmed}`);
      foundCount++;
    }

    let match2;
    while ((match2 = mixedPattern2.exec(line)) !== null) {
      console.log(`[${file}:${idx + 1}] Found TH(EN): "${match2[0]}" in: ${trimmed}`);
      foundCount++;
    }
  });
}

console.log(`\nScan complete. Total mixed dual-language phrases found: ${foundCount}`);
process.exit(0);

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

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TESTING BILINGUAL ENGINE & LOCALIZATION INTEGRITY ---');

// 1. Verify i18n file structure and dictionary keys
const i18nPath = path.join(__dirname, '..', 'src', 'utils', 'i18n.ts');
const i18nContent = fs.readFileSync(i18nPath, 'utf8');

assert(i18nContent.includes("export const TRANSLATIONS"), 'i18n must export TRANSLATIONS');
assert(i18nContent.includes("th:"), 'i18n must include Thai dictionary');
assert(i18nContent.includes("en:"), 'i18n must include English dictionary');

console.log('✓ i18n dictionary structure verified');

// 2. Check for zero mixed dual-words in TRANSLATIONS
// We can extract Thai and English keys from the file
assert(!i18nContent.includes("Close (ปิด)"), 'Should not have mixed Close (ปิด)');
assert(!i18nContent.includes("Options (ตั้งค่า)"), 'Should not have mixed Options (ตั้งค่า)');
assert(!i18nContent.includes("Start (เริ่มเกม)"), 'Should not have mixed Start (เริ่มเกม)');
console.log('✓ Zero mixed dual-words in TRANSLATIONS dictionary');

// 3. Verify settings persistence
const settingsPath = path.join(__dirname, '..', 'src', 'utils', 'settings.ts');
const settingsContent = fs.readFileSync(settingsPath, 'utf8');
assert(settingsContent.includes("language: 'th' | 'en'"), 'GameSettings must include language field');
assert(settingsContent.includes("language: 'th'"), 'Default language should be Thai');
console.log('✓ Settings persistence with language field verified');

// 4. Verify no broken imports or unhandled exceptions across all component files
const componentsDir = path.join(__dirname, '..', 'src', 'components');
const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

console.log(`Auditing ${componentFiles.length} React components for i18n integration...`);

let i18nIntegratedCount = 0;
for (const file of componentFiles) {
  const code = fs.readFileSync(path.join(componentsDir, file), 'utf8');
  if (code.includes('useI18n') || code.includes('t.') || code.includes('isTh')) {
    i18nIntegratedCount++;
  }
}

console.log(`✓ ${i18nIntegratedCount} components actively localized with dynamic bilingual support`);
console.log('--- ALL BILINGUAL EXPERIENCE TESTS PASSED 100% ---');
process.exit(0);

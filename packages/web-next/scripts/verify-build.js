import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildDir = join(__dirname, '..', '.next', 'server', 'app');

const criticalPages = ['profile', 'builder', 'community', 'admin', 'login'];

console.log('Verifying critical pages in build output...\n');

let missing = 0;

for (const page of criticalPages) {
    const pagePath = join(buildDir, page);
    if (existsSync(pagePath)) {
        console.log(`  OK      /${page}`);
    } else {
        console.log(`  MISSING /${page}`);
        missing++;
    }
}

console.log('');

if (missing > 0) {
    console.error(`Build verification failed: ${missing} critical page(s) missing.`);
    process.exit(1);
} else {
    console.log('All critical pages present. Build verified.');
}

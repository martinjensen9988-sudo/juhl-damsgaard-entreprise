import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const distDir = join(root, 'dist');
const requiredFiles = [
  join(distDir, 'index.html'),
  join(distDir, '.htaccess'),
];

const missing = requiredFiles.filter((file) => !existsSync(file));

if (missing.length > 0) {
  console.error('Simply build is missing required files:');
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');

if (!indexHtml.includes('/assets/')) {
  console.error('dist/index.html does not reference built assets.');
  process.exit(1);
}

const htaccess = readFileSync(join(distDir, '.htaccess'), 'utf8');

if (!htaccess.includes('RewriteRule ^ index.html [L]')) {
  console.error('dist/.htaccess is missing the React Router fallback.');
  process.exit(1);
}

const assetsDir = join(distDir, 'assets');

if (!existsSync(assetsDir) || !statSync(assetsDir).isDirectory()) {
  console.error('dist/assets is missing.');
  process.exit(1);
}

console.log('Simply build is ready: upload the contents of dist/ to public_html.');

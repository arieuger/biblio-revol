import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const env = { ...process.env };

function run(command, args, { allowFailure = false } = {}) {
  console.log(`[build] Running: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  });

  const status = result.status ?? 1;
  if (status !== 0 && !allowFailure) {
    console.error(`[build] Command failed with exit code ${status}`);
    process.exit(status);
  }
  return status;
}

// 0. Generate sitemap
console.log('[build] Generating sitemap...');
run('node', ['scripts/generate-sitemap.mjs']);

// 0. Sync calendar settings
console.log('[build] Syncing calendar settings...');
const sourceFile = 'content/settings/calendar.json';
const targetFile = 'public/settings/calendar.json';

if (fs.existsSync(sourceFile)) {
  const targetDir = path.dirname(targetFile);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`[build] Copied ${sourceFile} to ${targetFile}`);
} else {
  console.warn(`[build] Warning: ${sourceFile} not found!`);
}

// 0. Sync the library scene configuration edited through DecapCMS.
console.log('[build] Syncing library composition settings...');
const libraryCompositionSource = 'content/settings/library-composition.json';
const libraryCompositionTarget = 'public/settings/library-composition.json';

if (fs.existsSync(libraryCompositionSource)) {
  const targetDir = path.dirname(libraryCompositionTarget);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(libraryCompositionSource, libraryCompositionTarget);
  console.log(`[build] Copied ${libraryCompositionSource} to ${libraryCompositionTarget}`);
} else {
  console.warn(`[build] Warning: ${libraryCompositionSource} not found!`);
}

const libraryMappingsSource = 'content/settings/library-shelf-mappings.json';
const libraryMappingsTarget = 'public/settings/library-shelf-mappings.json';
if (fs.existsSync(libraryMappingsSource)) {
  fs.copyFileSync(libraryMappingsSource, libraryMappingsTarget);
  console.log(`[build] Copied ${libraryMappingsSource} to ${libraryMappingsTarget}`);
} else {
  console.warn(`[build] Warning: ${libraryMappingsSource} not found!`);
}

// 1. Clean
if (fs.existsSync('dist')) fs.rmSync('dist', { recursive: true, force: true });

// 2. Vite Build
console.log('[build] Running Vite build...');
run('npx', ['vite', 'build']);

// 3. Pre-renderizado de meta tags Open Graph por ruta
// Xera ficheiros HTML estáticos con os meta tags OG correctos para cada ruta,
// de xeito que os bots (Telegram, WhatsApp, Bluesky, X...) que non executan
// JavaScript reciban os meta tags correctos ao rastrexar a URL.
console.log('[build] Running Open Graph pre-rendering...');
run('node', ['scripts/prerender-og.mjs']);

console.log('[build] Build complete!');

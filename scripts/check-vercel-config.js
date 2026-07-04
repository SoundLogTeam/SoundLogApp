#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const projectRoot = path.resolve(__dirname, '..');
const errors = [];

function addError(message) {
  errors.push(message);
}

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

async function main() {
  const vercelJsonPath = path.join(projectRoot, 'vercel.json');
  const vercelConfigPath = path.join(projectRoot, 'vercel.mjs');

  if (fs.existsSync(vercelJsonPath)) {
    addError('Use only vercel.mjs. vercel.json must not exist alongside it.');
  }

  const configText = readIfExists(vercelConfigPath);

  if (!configText) {
    addError('Missing vercel.mjs.');
  }

  ['52.79.185.121', '54.226.62.131', 'api.soundlog.shop'].forEach((marker) => {
    if (configText.includes(marker)) {
      addError(`vercel.mjs must not hard-code stale API origin ${marker}.`);
    }
  });

  delete process.env.SOUNDLOG_API_ORIGIN;

  const missingEnvImport = await import(
    `${pathToFileURL(vercelConfigPath).href}?check=missing-${Date.now()}`
  );
  const missingEnvRewrite = missingEnvImport.config?.rewrites?.find(
    (rewrite) => rewrite.source === '/api/soundlog/(.*)',
  );

  if (missingEnvRewrite?.destination !== 'https://soundlog-api-origin-missing.invalid/$1') {
    addError('Vercel config must keep a schema-valid placeholder when SOUNDLOG_API_ORIGIN is missing.');
  }

  if (!missingEnvImport.config?.buildCommand?.startsWith('node scripts/require-vercel-api-origin.js && ')) {
    addError('Vercel build must validate SOUNDLOG_API_ORIGIN before exporting web assets.');
  }

  process.env.SOUNDLOG_API_ORIGIN = 'http://soundlog-api-origin.test:4000';

  const imported = await import(`${pathToFileURL(vercelConfigPath).href}?check=${Date.now()}`);
  const config = imported.config;
  const apiRewrite = config?.rewrites?.find(
    (rewrite) => rewrite.source === '/api/soundlog/(.*)',
  );

  if (config?.buildCommand?.includes('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog') !== true) {
    addError('Vercel build must inline EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog.');
  }

  if (config?.outputDirectory !== 'dist') {
    addError('Vercel outputDirectory must be dist.');
  }

  if (apiRewrite?.destination !== 'http://soundlog-api-origin.test:4000/$1') {
    addError('Vercel API rewrite must use SOUNDLOG_API_ORIGIN as its destination.');
  }

  if (errors.length > 0) {
    console.error('Vercel config check failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Vercel config check passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

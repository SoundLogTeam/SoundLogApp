#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'soundlog-web-export-'));
const errors = [];

function addError(message) {
  errors.push(message);
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(nextPath);
    }

    return nextPath;
  });
}

function readBundleText() {
  const jsFiles = listFiles(outputDir).filter((filePath) => filePath.endsWith('.js'));

  if (jsFiles.length === 0) {
    addError('Server web export did not produce any JavaScript bundles.');
    return '';
  }

  return jsFiles.map((filePath) => fs.readFileSync(filePath, 'utf8')).join('\n');
}

function assertIncludes(bundleText, pattern, message) {
  if (typeof pattern === 'string' ? !bundleText.includes(pattern) : !pattern.test(bundleText)) {
    addError(message);
  }
}

function assertExcludes(bundleText, pattern, message) {
  if (typeof pattern === 'string' ? bundleText.includes(pattern) : pattern.test(bundleText)) {
    addError(message);
  }
}

function runExport() {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['expo', 'export', '--platform', 'web', '--output-dir', outputDir],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        EXPO_PUBLIC_SOUNDLOG_API_BASE_URL: '/api/soundlog',
        EXPO_PUBLIC_SOUNDLOG_API_SOURCE: 'server',
      },
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    addError(`Server web export failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

function verifyBundle(bundleText) {
  assertIncludes(
    bundleText,
    '/api/soundlog',
    'Server web export must inline EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog.',
  );
  assertIncludes(
    bundleText,
    /apiSource\s*:\s*['"]server['"]/,
    'Server web export must initialize apiSource as server.',
  );
  assertExcludes(
    bundleText,
    'http://52.79.185.121:4000',
    'Server web export must not inline the direct EC2 HTTP API URL.',
  );
  assertExcludes(
    bundleText,
    'spotify-auth',
    'Server web export must not include the removed Spotify auth route.',
  );
  assertExcludes(
    bundleText,
    'soundlog-spotify-auth',
    'Server web export must not include the removed Spotify auth store.',
  );
  assertExcludes(
    bundleText,
    'playSelectedSpotifyOrFallback',
    'Server web export must not include removed Spotify playback helpers.',
  );
  assertExcludes(
    bundleText,
    'open.spotify.com',
    'Server web export must not include Spotify external search URLs.',
  );
}

try {
  runExport();

  if (errors.length === 0) {
    verifyBundle(readBundleText());
  }
} finally {
  fs.rmSync(outputDir, { force: true, recursive: true });
}

if (errors.length > 0) {
  console.error('Server web export check failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Server web export check passed.');

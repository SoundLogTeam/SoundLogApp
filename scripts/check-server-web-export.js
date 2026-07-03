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

function readTextFiles(dir) {
  return listFiles(dir)
    .filter((filePath) => /\.(ts|tsx|js|jsx)$/.test(filePath))
    .map((filePath) => ({
      filePath,
      text: fs.readFileSync(filePath, 'utf8'),
    }));
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

function verifyApiSourceFiles() {
  const apiDir = path.join(projectRoot, 'src/api');
  const blockedApiImports = [
    '@/mock-server',
    '@/mocks',
    '@/api/mockDelay',
    '@/api/apiSource',
    '@/api/mockServerClient',
  ];

  readTextFiles(apiDir).forEach(({ filePath, text }) => {
    blockedApiImports.forEach((blockedImport) => {
      if (text.includes(blockedImport)) {
        addError(
          `Server API facade must not import ${blockedImport}: ${path.relative(projectRoot, filePath)}`,
        );
      }
    });
  });
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
    'shouldUseServerApi=function(){return!0}',
    'Server web export must compile shouldUseServerApi as always true.',
  );
  assertExcludes(
    bundleText,
    'http://52.79.185.121:4000',
    'Server web export must not inline the direct EC2 HTTP API URL.',
  );
  [
    ['authMockHandlers', 'Server web export must not include auth mock handlers.'],
    ['homeMockHandlers', 'Server web export must not include home mock handlers.'],
    ['playlistMockHandlers', 'Server web export must not include playlist mock handlers.'],
    ['recapMockHandlers', 'Server web export must not include recap mock handlers.'],
    ['tourMockHandlers', 'Server web export must not include tour mock handlers.'],
    ['mockServerDelay', 'Server web export must not include mock server delay helpers.'],
    ['mock-user-email', 'Server web export must not include seeded mock auth data.'],
    ['DevTestManager', 'Server web export must not include the native development test manager.'],
    ['dev-access-', 'Server web export must not include development auth tokens.'],
    ['dev-refresh-', 'Server web export must not include development refresh tokens.'],
    ['Soundlog 테스트 유저', 'Server web export must not include development test users.'],
    ['playlistCurationById', 'Server web export must not include seeded mock playlist maps.'],
    ['mock-namsan', 'Server web export must not include seeded mock nearby places.'],
    ['mock-gwangalli', 'Server web export must not include seeded mock nearby places.'],
    [
      'EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS',
      'Server web export must not include mock API failure controls.',
    ],
    [
      'EXPO_PUBLIC_MOCK_API_DELAY_MS',
      'Server web export must not include mock API delay controls.',
    ],
  ].forEach(([pattern, message]) => {
    assertExcludes(bundleText, pattern, message);
  });
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
  verifyApiSourceFiles();
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

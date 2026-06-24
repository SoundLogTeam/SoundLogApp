#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const infoPlistPath = path.join(projectRoot, 'ios/Soundlog/Info.plist');
const nativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
const plistBuddy = '/usr/libexec/PlistBuddy';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function runPlistBuddy(command) {
  return execFileSync(plistBuddy, ['-c', command, infoPlistPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runPlistBuddyIfPossible(command) {
  try {
    runPlistBuddy(command);
  } catch {
    // PlistBuddy exits non-zero when adding an already existing key.
  }
}

function readPlistText() {
  return fs.readFileSync(infoPlistPath, 'utf8');
}

function ensureArray(pathExpression) {
  runPlistBuddyIfPossible(`Add ${pathExpression} array`);
}

function ensureQueryScheme(scheme) {
  const plist = readPlistText();

  if (plist.includes(`<string>${scheme}</string>`)) {
    return;
  }

  const output = runPlistBuddy('Print :LSApplicationQueriesSchemes');
  const index = (output.match(/^\s{4}\S+/gm) ?? []).length;
  runPlistBuddy(`Add :LSApplicationQueriesSchemes:${index} string ${scheme}`);
}

function ensureKakaoUrlScheme() {
  const scheme = `kakao${nativeAppKey}`;
  const plist = readPlistText();

  if (plist.includes(`<string>${scheme}</string>`)) {
    return;
  }

  const output = runPlistBuddy('Print :CFBundleURLTypes');
  const index = (output.match(/Dict \{/g) ?? []).length;

  runPlistBuddy(`Add :CFBundleURLTypes:${index} dict`);
  runPlistBuddy(`Add :CFBundleURLTypes:${index}:CFBundleURLName string Kakao`);
  runPlistBuddy(`Add :CFBundleURLTypes:${index}:CFBundleURLSchemes array`);
  runPlistBuddy(`Add :CFBundleURLTypes:${index}:CFBundleURLSchemes:0 string ${scheme}`);
}

function main() {
  if (!nativeAppKey) {
    fail('EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY is required.');
  }

  if (!fs.existsSync(infoPlistPath)) {
    fail(`Info.plist not found: ${infoPlistPath}`);
  }

  ensureArray(':LSApplicationQueriesSchemes');
  ['kakaokompassauth', 'kakaolink', 'kakaoplus'].forEach(ensureQueryScheme);
  ensureKakaoUrlScheme();

  console.log(`Applied Kakao iOS URL scheme: kakao${nativeAppKey}`);
}

main();

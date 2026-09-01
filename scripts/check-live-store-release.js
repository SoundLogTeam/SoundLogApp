#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const easConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'eas.json'), 'utf8'));
const productionEnv = easConfig.build?.production?.env ?? {};
const apiBaseUrl = (
  process.env.SOUNDLOG_RELEASE_API_BASE_URL ??
  productionEnv.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL ??
  ''
).replace(/\/+$/, '');
const requiredOpenApiPaths = [
  '/v1/community/blocks:',
  '/v1/community/reports:',
  '/v1/admin/moderation/reports:',
];
const errors = [];

function addError(message) {
  errors.push(message);
}

async function fetchReleasePath(endpoint) {
  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      headers: {
        accept: endpoint === '/openapi.yaml' ? 'text/yaml,text/plain' : '*/*',
      },
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();

    return { body, response };
  } catch (error) {
    addError(
      `${endpoint} request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
}

async function assertPublicPage(endpoint, expectedText) {
  const result = await fetchReleasePath(endpoint);

  if (!result) {
    return;
  }

  if (result.response.status !== 200) {
    addError(`${endpoint} returned HTTP ${result.response.status}; expected 200.`);
    return;
  }

  if (!result.body.includes(expectedText)) {
    addError(`${endpoint} did not include the expected Soundlog document text.`);
  }
}

async function main() {
  if (apiBaseUrl !== 'https://api.soundlog.p-e.kr') {
    throw new Error(
      'SOUNDLOG_RELEASE_API_BASE_URL must resolve to https://api.soundlog.p-e.kr for release checks.',
    );
  }

  const healthResult = await fetchReleasePath('/v1/health');

  if (healthResult) {
    if (healthResult.response.status !== 200) {
      addError(`/v1/health returned HTTP ${healthResult.response.status}; expected 200.`);
    } else {
      try {
        const health = JSON.parse(healthResult.body)?.data;

        if (health?.status !== 'ok' || health?.database !== 'ok') {
          addError('/v1/health did not report both API and database status as ok.');
        }
      } catch {
        addError('/v1/health did not return valid JSON.');
      }
    }
  }

  await Promise.all([
    assertPublicPage('/legal/privacy', '개인정보 처리방침'),
    assertPublicPage('/legal/terms', '서비스 이용약관'),
    assertPublicPage('/support', '고객지원'),
  ]);

  const adminResult = await fetchReleasePath('/v1/admin/moderation/reports');

  if (adminResult && adminResult.response.status !== 401) {
    addError(
      `/v1/admin/moderation/reports returned HTTP ${adminResult.response.status}; expected 401 without the admin key.`,
    );
  }

  const openApiResult = await fetchReleasePath('/openapi.yaml');

  if (openApiResult) {
    if (openApiResult.response.status !== 200) {
      addError(`/openapi.yaml returned HTTP ${openApiResult.response.status}; expected 200.`);
    } else {
      requiredOpenApiPaths.forEach((requiredPath) => {
        if (!openApiResult.body.includes(requiredPath)) {
          addError(`/openapi.yaml is missing ${requiredPath.slice(0, -1)}.`);
        }
      });
    }
  }

  if (errors.length > 0) {
    console.error('Live store release check failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Live store release check passed for ${apiBaseUrl}.`);
}

void main();

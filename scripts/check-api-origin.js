#!/usr/bin/env node

const errors = [];
const apiOrigin = (process.argv[2] || process.env.SOUNDLOG_API_ORIGIN || '').replace(/\/+$/, '');

if (!apiOrigin) {
  console.error('Usage: npm run check:api-origin -- http://<EC2_HOST>:4000');
  process.exit(1);
}

function addError(message) {
  errors.push(message);
}

function withOrigin(path) {
  return `${apiOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

async function fetchText(path) {
  const url = withOrigin(path);
  const response = await fetch(url, { redirect: 'manual' });
  const text = await response.text();

  return { response, text, url };
}

async function fetchJson(path) {
  const { response, text, url } = await fetchText(path);

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}: ${text.slice(0, 180)}`);
  }

  return JSON.parse(text);
}

async function verifyHealth() {
  try {
    const payload = await fetchJson('/v1/health');

    if (payload?.data?.status !== 'ok') {
      addError(`/v1/health returned unexpected payload: ${JSON.stringify(payload)}`);
    }
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
  }
}

async function verifyOpenApi() {
  try {
    const { response, text, url } = await fetchText('/openapi.yaml');

    if (!response.ok) {
      addError(`${url} returned HTTP ${response.status}.`);
    }

    if (!text.includes('openapi: 3.1.0') || !text.includes('/v1/auth/register')) {
      addError('/openapi.yaml does not look like the current SoundLogServer contract.');
    }
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
  }
}

async function verifyNearbyPlaces() {
  try {
    const payload = await fetchJson(
      '/v1/tour/nearby-places?lat=35.1595&lng=129.1604&radiusMeters=2000&limit=1',
    );
    const place = payload?.data?.[0];

    if (!place) {
      addError('/v1/tour/nearby-places returned an empty payload.');
      return;
    }

    if (typeof place.id === 'string' && place.id.startsWith('mock-')) {
      addError('/v1/tour/nearby-places returned a legacy mock-* place id.');
    }

    if (place.source === 'mock') {
      addError('/v1/tour/nearby-places returned legacy source="mock".');
    }
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
  }
}

async function verifyMusicMetadata() {
  try {
    const payload = await fetchJson(
      '/v1/home/mood-recommendations?limit=3&moodFilter=%EC%A0%84%EC%B2%B4&recommendationMode=everyday&topFilter=%EC%A0%84%EC%B2%B4',
    );
    const serialized = JSON.stringify(payload?.data ?? {});

    if (serialized.includes('open.spotify.com') || /"spotify"\s*:/.test(serialized)) {
      addError('/v1/home/mood-recommendations still exposes Spotify metadata.');
    }
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
  }
}

async function verifyLegacyMusicPlatformRouteRemoved() {
  try {
    const { response, text, url } = await fetchText('/v1/me/music-platform');

    if (response.status !== 404) {
      addError(
        `${url} returned HTTP ${response.status}; expected 404 for removed music platform API. sample=${text.slice(
          0,
          120,
        )}`,
      );
    }
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  await verifyHealth();
  await verifyOpenApi();
  await verifyNearbyPlaces();
  await verifyMusicMetadata();
  await verifyLegacyMusicPlatformRouteRemoved();

  if (errors.length > 0) {
    console.error('SoundLog API origin check failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`SoundLog API origin check passed: ${apiOrigin}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

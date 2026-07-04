#!/usr/bin/env node

const errors = [];

const baseUrl = (process.argv[2] || process.env.SOUNDLOG_WEB_BASE_URL || '').replace(/\/+$/, '');
const bypassSecret =
  process.env.SOUNDLOG_VERCEL_PROTECTION_BYPASS || process.env.VERCEL_PROTECTION_BYPASS;

if (!baseUrl) {
  console.error(
    'Usage: npm run check:deployed-web -- https://your-soundlog-deployment.vercel.app',
  );
  process.exit(1);
}

function addError(message) {
  errors.push(message);
}

function withBase(path) {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function getHeaders() {
  return bypassSecret ? { 'x-vercel-protection-bypass': bypassSecret } : {};
}

function getLocation(response) {
  return response.headers.get('location') ?? '';
}

function isVercelProtectionRedirect(response) {
  return response.status >= 300 && response.status < 400 && getLocation(response).includes('/sso-api');
}

function protectionMessage(url) {
  return [
    `${url} is behind Vercel Deployment Protection.`,
    'Disable Vercel Authentication for the preview environment or run this check with',
    'SOUNDLOG_VERCEL_PROTECTION_BYPASS set to the project bypass secret.',
  ].join(' ');
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: getHeaders(),
    redirect: 'manual',
  });

  if (isVercelProtectionRedirect(response)) {
    throw new Error(protectionMessage(url));
  }

  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${url} redirected to ${getLocation(response) || '(missing location)'}.`);
  }

  return {
    contentType: response.headers.get('content-type') ?? '',
    response,
    text: await response.text(),
  };
}

async function fetchJson(path) {
  const url = withBase(path);
  const { contentType, response, text } = await fetchText(url);

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}: ${text.slice(0, 180)}`);
  }

  if (!contentType.includes('application/json') && !text.trim().startsWith('{')) {
    throw new Error(
      `${url} did not return JSON. content-type=${contentType}; sample=${text
        .slice(0, 180)
        .replace(/\s+/g, ' ')}`,
    );
  }

  return JSON.parse(text);
}

async function verifyApiProxy() {
  const endpoints = [
    '/api/soundlog/v1/health',
    '/api/soundlog/v1/home/featured-playlists?limit=3&locationRecommendationEnabled=false&recommendationMode=everyday',
    '/api/soundlog/v1/home/mood-recommendations?limit=3&moodFilter=%EC%A0%84%EC%B2%B4&recommendationMode=everyday&topFilter=%EC%A0%84%EC%B2%B4',
    '/api/soundlog/v1/playlists/geoje-ocean',
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJson(endpoint);
      const data = payload.data;

      if (endpoint.includes('/health')) {
        if (data?.status !== 'ok') {
          addError(`${endpoint} returned unexpected health status: ${JSON.stringify(data)}`);
        }
      } else if (endpoint.includes('/home/')) {
        if (!Array.isArray(data)) {
          addError(`${endpoint} did not return an array data payload.`);
        }
      } else if (endpoint.includes('/playlists/')) {
        if (!data?.id || !Array.isArray(data.tracks)) {
          addError(`${endpoint} did not return a playlist with tracks.`);
        }
      }
    } catch (error) {
      addError(error instanceof Error ? error.message : String(error));
    }
  }
}

async function verifyServerContract() {
  try {
    const url = withBase('/api/soundlog/openapi.yaml');
    const { response, text } = await fetchText(url);

    if (!response.ok) {
      addError(`${url} returned HTTP ${response.status}.`);
    }

    if (!text.includes('openapi: 3.1.0') || !text.includes('/v1/auth/register')) {
      addError('/api/soundlog/openapi.yaml does not look like the current SoundLogServer contract.');
    }
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
  }

  try {
    const payload = await fetchJson(
      '/api/soundlog/v1/tour/nearby-places?lat=35.1595&lng=129.1604&radiusMeters=2000&limit=1',
    );
    const place = payload?.data?.[0];

    if (!place) {
      addError('/api/soundlog/v1/tour/nearby-places returned an empty payload.');
    } else {
      if (typeof place.id === 'string' && place.id.startsWith('mock-')) {
        addError('/api/soundlog/v1/tour/nearby-places returned a legacy mock-* place id.');
      }

      if (place.source === 'mock') {
        addError('/api/soundlog/v1/tour/nearby-places returned legacy source="mock".');
      }
    }
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
  }

  try {
    const payload = await fetchJson(
      '/api/soundlog/v1/home/mood-recommendations?limit=3&moodFilter=%EC%A0%84%EC%B2%B4&recommendationMode=everyday&topFilter=%EC%A0%84%EC%B2%B4',
    );
    const serialized = JSON.stringify(payload?.data ?? {});

    if (serialized.includes('open.spotify.com') || /"spotify"\s*:/.test(serialized)) {
      addError('/api/soundlog/v1/home/mood-recommendations still exposes Spotify metadata.');
    }
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
  }

  try {
    const url = withBase('/api/soundlog/v1/me/music-platform');
    const { response, text } = await fetchText(url);

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

function getScriptUrls(html) {
  return [...html.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/g)]
    .map((match) => new URL(match[1], `${baseUrl}/`).href)
    .filter((url) => url.includes('/_expo/static/js/'));
}

async function verifyBundle() {
  let html;

  try {
    const result = await fetchText(withBase('/'));
    html = result.text;
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
    return;
  }

  const scriptUrls = getScriptUrls(html);

  if (scriptUrls.length === 0) {
    addError(
      `Deployment root does not look like the Expo web app. This may be a Vercel protection page. sample=${html
        .slice(0, 180)
        .replace(/\s+/g, ' ')}`,
    );
    return;
  }

  const bundleParts = [];

  for (const scriptUrl of scriptUrls) {
    try {
      const { response, text } = await fetchText(scriptUrl);

      if (!response.ok) {
        addError(`${scriptUrl} returned HTTP ${response.status}.`);
      } else {
        bundleParts.push(text);
      }
    } catch (error) {
      addError(error instanceof Error ? error.message : String(error));
    }
  }

  const bundleText = bundleParts.join('\n');
  const requiredMarkers = [
    ['/api/soundlog', 'Deployed bundle must call the Vercel API proxy.'],
    [
      'shouldUseServerApi=function(){return!0}',
      'Deployed bundle must compile shouldUseServerApi as always true.',
    ],
  ];
  const blockedMarkers = [
    ['authMockHandlers', 'Deployed bundle must not include auth mock handlers.'],
    ['homeMockHandlers', 'Deployed bundle must not include home mock handlers.'],
    ['playlistMockHandlers', 'Deployed bundle must not include playlist mock handlers.'],
    ['recapMockHandlers', 'Deployed bundle must not include recap mock handlers.'],
    ['tourMockHandlers', 'Deployed bundle must not include tour mock handlers.'],
    ['mockServerDelay', 'Deployed bundle must not include mock server delay helpers.'],
    ['mock-user-email', 'Deployed bundle must not include seeded mock auth data.'],
    ['playlistCurationById', 'Deployed bundle must not include seeded mock playlist maps.'],
    ['seed-namsan', 'Deployed bundle must not include seeded nearby places.'],
    ['seed-gwangalli', 'Deployed bundle must not include seeded nearby places.'],
    [
      'EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS',
      'Deployed bundle must not include mock API failure controls.',
    ],
    [
      'EXPO_PUBLIC_MOCK_API_DELAY_MS',
      'Deployed bundle must not include mock API delay controls.',
    ],
    ['NOW PLAYING', 'Deployed bundle must not imply in-app streaming playback.'],
    ['track_play', 'Deployed bundle must not include fake play events.'],
    ['track_pause', 'Deployed bundle must not include fake pause events.'],
    ['track_resume', 'Deployed bundle must not include fake resume events.'],
    ['track_skip', 'Deployed bundle must not include fake skip playback events.'],
    ['spotify-auth', 'Deployed bundle must not include the removed Spotify auth route.'],
    ['open.spotify.com', 'Deployed bundle must not include Spotify external search URLs.'],
    [
      'playSelectedSpotifyOrFallback',
      'Deployed bundle must not include removed Spotify playback helpers.',
    ],
  ];

  requiredMarkers.forEach(([marker, message]) => {
    if (!bundleText.includes(marker)) {
      addError(message);
    }
  });

  blockedMarkers.forEach(([marker, message]) => {
    if (bundleText.includes(marker)) {
      addError(message);
    }
  });
}

async function main() {
  await verifyApiProxy();
  await verifyServerContract();
  await verifyBundle();

  if (errors.length > 0) {
    console.error('Deployed web check failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Deployed web check passed: ${baseUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

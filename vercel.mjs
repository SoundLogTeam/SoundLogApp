const missingApiOrigin = 'https://soundlog-api-origin-missing.invalid';

function getApiOriginForConfig() {
  const apiOrigin = process.env.SOUNDLOG_API_ORIGIN?.replace(/\/+$/, '');

  if (!apiOrigin || !/^https?:\/\//.test(apiOrigin)) {
    return missingApiOrigin;
  }

  return apiOrigin;
}

const apiOrigin = getApiOriginForConfig();

export const config = {
  buildCommand:
    'node scripts/require-vercel-api-origin.js && EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog npx expo export --platform web',
  outputDirectory: 'dist',
  rewrites: [
    {
      source: '/api/soundlog/:path*',
      destination: `${apiOrigin}/:path*`,
    },
    {
      source: '/:path*',
      destination: '/index.html',
    },
  ],
};

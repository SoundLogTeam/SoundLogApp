function getRequiredApiOrigin() {
  const apiOrigin = process.env.SOUNDLOG_API_ORIGIN?.replace(/\/+$/, '');

  if (!apiOrigin) {
    throw new Error(
      'SOUNDLOG_API_ORIGIN is required. Set it to the SoundLogServer origin, for example http://<EC2_HOST>:4000.',
    );
  }

  if (!/^https?:\/\//.test(apiOrigin)) {
    throw new Error('SOUNDLOG_API_ORIGIN must start with http:// or https://.');
  }

  return apiOrigin;
}

const apiOrigin = getRequiredApiOrigin();

export const config = {
  buildCommand:
    'EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog npx expo export --platform web',
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

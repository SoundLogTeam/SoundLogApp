export function isScreenshotModeEnabled(
  screenshotMode = process.env.EXPO_PUBLIC_SOUNDLOG_SCREENSHOT_MODE,
) {
  return screenshotMode === 'true';
}

export function shouldRenderDevTestManager({
  isDev,
  platform,
  screenshotMode,
}: {
  isDev: boolean;
  platform: string;
  screenshotMode?: string;
}) {
  return isDev && platform !== 'web' && !isScreenshotModeEnabled(screenshotMode);
}

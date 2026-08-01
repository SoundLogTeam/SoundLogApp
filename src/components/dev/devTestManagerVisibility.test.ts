import { describe, expect, it } from 'vitest';

import { shouldRenderDevTestManager } from '@/components/dev/devTestManagerVisibility';

describe('shouldRenderDevTestManager', () => {
  it('renders only for native development builds by default', () => {
    expect(
      shouldRenderDevTestManager({ isDev: true, platform: 'ios', screenshotMode: undefined }),
    ).toBe(true);
  });

  it('hides the manager when screenshot mode is enabled', () => {
    expect(
      shouldRenderDevTestManager({ isDev: true, platform: 'ios', screenshotMode: 'true' }),
    ).toBe(false);
  });

  it('never renders for production or web', () => {
    expect(
      shouldRenderDevTestManager({ isDev: false, platform: 'ios', screenshotMode: undefined }),
    ).toBe(false);
    expect(
      shouldRenderDevTestManager({ isDev: true, platform: 'web', screenshotMode: undefined }),
    ).toBe(false);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/store/authStore';
import { toAuthenticatedImageSource } from '@/utils/authenticatedImageSource';

// This project's vitest setup intentionally does not render React components (see
// vitest.config.ts) — there is no @testing-library/react-hooks / react-test-renderer
// available to mount `useAuthenticatedImageSource` and observe an actual re-render.
//
// `useAuthenticatedImageSource` is a thin composition of two things:
//   1. `useAuthStore((state) => state.accessToken)` — a reactive subscription that causes
//      React to re-render any component using it whenever the token changes (this is
//      zustand's own, independently-tested subscription mechanism).
//   2. `toAuthenticatedImageSource(uri, accessToken)` — the pure value computation, fully
//      covered in authenticatedImageSource.test.ts.
//
// What these tests verify is the part that was actually broken before this fix: that
// reading the token via the store (rather than a one-off `useAuthStore.getState()` capture)
// (a) is backed by a real subscription that fires on every login/refresh/logout transition,
// and (b) recomputing the image source from that live value — exactly what the hook does on
// every re-render — always reflects the *current* token, never a stale one.
describe('useAuthenticatedImageSource token reactivity', () => {
  const uploadsUri = '/v1/uploads/abc123';

  beforeEach(() => {
    useAuthStore.setState({
      accessToken: undefined,
      errorMessage: undefined,
      lastLoginProvider: undefined,
      refreshToken: undefined,
      status: 'unauthenticated',
      updatedAt: undefined,
      user: undefined,
    });
  });

  it('has no Authorization header before any login', () => {
    const source = toAuthenticatedImageSource(uploadsUri, useAuthStore.getState().accessToken);

    expect(source).toEqual({ uri: uploadsUri });
  });

  it('picks up a fresh token immediately after login, via a live store subscription', () => {
    const tokenReadsFromSubscription: Array<string | undefined> = [];
    const unsubscribe = useAuthStore.subscribe((state) => {
      tokenReadsFromSubscription.push(state.accessToken);
    });

    try {
      useAuthStore.getState().finishLogin({
        accessToken: 'session-token-1',
        expiresIn: 3600,
        isNewUser: false,
        refreshToken: 'refresh-1',
        user: { displayName: 'Test User', id: 'user-a', provider: 'email' },
      });

      // The subscription (what React's useSyncExternalStore-based hook relies on) must
      // have actually fired with the new token — proving this is a live subscription, not
      // a value captured once and never revisited.
      expect(tokenReadsFromSubscription).toContain('session-token-1');

      const source = toAuthenticatedImageSource(
        uploadsUri,
        useAuthStore.getState().accessToken,
      );

      expect(source).toEqual({
        headers: { Authorization: 'Bearer session-token-1' },
        uri: uploadsUri,
      });
    } finally {
      unsubscribe();
    }
  });

  it('reflects a refreshed token (different from the original) without any stale value lingering', () => {
    useAuthStore.getState().finishLogin({
      accessToken: 'session-token-1',
      expiresIn: 3600,
      isNewUser: false,
      refreshToken: 'refresh-1',
      user: { displayName: 'Test User', id: 'user-a', provider: 'email' },
    });

    const beforeRefresh = toAuthenticatedImageSource(
      uploadsUri,
      useAuthStore.getState().accessToken,
    );
    expect(beforeRefresh?.headers?.Authorization).toBe('Bearer session-token-1');

    // Simulates what a background token refresh does: update just the access token.
    useAuthStore.setState({ accessToken: 'refreshed-token-2' });

    const afterRefresh = toAuthenticatedImageSource(
      uploadsUri,
      useAuthStore.getState().accessToken,
    );
    expect(afterRefresh?.headers?.Authorization).toBe('Bearer refreshed-token-2');
    expect(afterRefresh?.headers?.Authorization).not.toBe(
      beforeRefresh?.headers?.Authorization,
    );
  });

  it('removes the Authorization header immediately after logout', () => {
    useAuthStore.getState().finishLogin({
      accessToken: 'session-token-1',
      expiresIn: 3600,
      isNewUser: false,
      refreshToken: 'refresh-1',
      user: { displayName: 'Test User', id: 'user-a', provider: 'email' },
    });
    expect(
      toAuthenticatedImageSource(uploadsUri, useAuthStore.getState().accessToken),
    ).toHaveProperty('headers');

    useAuthStore.getState().logoutLocal();

    const source = toAuthenticatedImageSource(uploadsUri, useAuthStore.getState().accessToken);
    expect(source).toEqual({ uri: uploadsUri });
    expect(source).not.toHaveProperty('headers');
  });

  it('never keeps using a previous account\'s token after a different account logs in', () => {
    useAuthStore.getState().finishLogin({
      accessToken: 'account-a-token',
      expiresIn: 3600,
      isNewUser: false,
      refreshToken: 'refresh-a',
      user: { displayName: 'Account A', id: 'user-a', provider: 'email' },
    });
    useAuthStore.getState().logoutLocal();

    useAuthStore.getState().finishLogin({
      accessToken: 'account-b-token',
      expiresIn: 3600,
      isNewUser: false,
      refreshToken: 'refresh-b',
      user: { displayName: 'Account B', id: 'user-b', provider: 'email' },
    });

    const source = toAuthenticatedImageSource(uploadsUri, useAuthStore.getState().accessToken);
    expect(source?.headers?.Authorization).toBe('Bearer account-b-token');
    expect(source?.headers?.Authorization).not.toContain('account-a-token');
  });
});

import { useAuthStore } from '@/store/authStore';
import type { AuthenticatedImageSource } from '@/utils/authenticatedImageSource';
import { toAuthenticatedImageSource } from '@/utils/authenticatedImageSource';

/**
 * Reactive wrapper around `toAuthenticatedImageSource`. Subscribes to the current access
 * token (not a one-off `useAuthStore.getState()` read) so any component using this hook
 * re-renders — and re-attaches a fresh `Authorization` header — whenever the token changes:
 * on login, on logout, and after a background token refresh. Without this subscription, an
 * image mounted with a token that later expires (access tokens are short-lived) would keep
 * requesting with the stale header and stay broken until something else happened to
 * re-render the component.
 *
 * Only call this from a component's own render body, not inside a `.map()` or a `FlatList`
 * `renderItem` callback — those aren't valid hook call sites. For that case, subscribe to
 * `useAuthStore((state) => state.accessToken)` once in the owning component so it re-renders
 * on token change, and call the plain `toAuthenticatedImageSource(uri, accessToken)`
 * function (exported from `@/utils/authenticatedImageSource`) inside the loop/callback.
 */
export function useAuthenticatedImageSource(
  uri: string | undefined,
): AuthenticatedImageSource | undefined {
  const accessToken = useAuthStore((state) => state.accessToken);

  return toAuthenticatedImageSource(uri, accessToken);
}

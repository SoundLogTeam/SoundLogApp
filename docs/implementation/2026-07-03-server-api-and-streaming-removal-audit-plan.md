# Server API and streaming removal audit plan

## Goal

Make the app behavior honest and testable:

- production/web server mode must call the real Soundlog API, not the in-app mock server
- mock data must not be reachable through the app API facades
- music recommendation can stay, but in-app music streaming and Spotify playback control must be removed
- any music action shown to users must either open an external music link/search or clearly behave as local selection only

## Evidence gathered

- Live `https://sound-log-app.vercel.app/api/soundlog/v1/health` returns the EC2 server health payload.
- The checked web export contains `getApiBaseUrl() => "/api/soundlog"` and compiles `shouldUseServerApi()` to always true.
- Live home endpoints respond through the Vercel proxy:
  - `/api/soundlog/v1/home/mood-recommendations`
  - `/api/soundlog/v1/playlists/{id}`
- The app no longer imports `mockServer` from API facades; the web export check fails if mock handlers are bundled again.
- Main server-backed read APIs use server mode and require a valid Soundlog access token.
- Current playback UI is misleading: `playerStore.setTrack()` sets `isPlaying: true` even when no preview or stream exists.
- Spotify auth/playback code remains in the app even though streaming will be removed.

## Scope

### App changes

1. Server/mock audit hardening
   - Remove mock server fallback branches from API facades.
   - Compile `shouldUseServerApi()` as server-only.
   - Add documentation/verification notes explaining that source-level legacy mocks are not part of the app API runtime.

2. Remove in-app streaming and Spotify playback
   - Remove Spotify OAuth callback route and Spotify auth/playback modules.
   - Remove Spotify/music platform connection UI from My page.
   - Remove production release requirement for `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`.
   - Remove `expo-auth-session`, `expo-web-browser`, Spotify app query scheme, and Spotify extra config if unused.

3. Make music actions honest
   - Replace `playSelectedSpotifyOrFallback` usage with a simple external-link action.
   - Change playlist, library, home recommendation, and mini-player actions to:
     - select the track in local player context
     - open an external music URL/search when available
     - record `track_external_open`, not fake `track_play`
   - Stop setting `isPlaying: true` when a track is selected.
   - Replace play/pause copy/icons that imply in-app streaming with external/open/select wording.

4. Verification
   - `npm run typecheck`
   - `npm run check:store-release` without Spotify client id
   - web export with server proxy env
   - search for removed Spotify playback/auth imports
   - search built bundle for `/api/soundlog`, always-server mode, and absence of mock handlers

## Non-goals for this first loop

- Implement actual audio preview playback.
- Implement Spotify/Melon SDK streaming.
- Remove all track metadata links from seed data.
- Remove server-side music platform endpoints, because they may remain backward-compatible and are not user-facing after this app change.

## Risks

- Removing `expo-web-browser` is safe only if no other active route imports it.
- Some users may still expect a persistent mini-player; it should become a selected-track/external-open panel rather than a streaming control.
- The server seed data intentionally resembles old mock data, so visual similarity alone does not prove mock usage; network and bundle evidence are required.

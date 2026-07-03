# Server API and streaming removal audit plan

## Goal

Make the app behavior honest and testable:

- production/web server mode must call the real Soundlog API, not the in-app mock server
- mock data must remain an explicit local/dev fallback only
- music recommendation can stay, but in-app music streaming and Spotify playback control must be removed
- any music action shown to users must either open an external music link/search or clearly behave as local selection only

## Evidence gathered

- Live `https://sound-log-app.vercel.app/api/soundlog/v1/health` returns the EC2 server health payload.
- The current live web bundle contains `getApiBaseUrl() => "/api/soundlog"` and initializes `apiSource: "server"`.
- Live home endpoints respond through the Vercel proxy:
  - `/api/soundlog/v1/home/mood-recommendations`
  - `/api/soundlog/v1/playlists/{id}`
- The app still bundles `mockServer` modules because API facades statically import them for local fallback.
- Main server-backed read APIs use server mode, but authenticated APIs intentionally return empty/no-op values when the user is a guest or has no token.
- Current playback UI is misleading: `playerStore.setTrack()` sets `isPlaying: true` even when no preview or stream exists.
- Spotify auth/playback code remains in the app even though streaming will be removed.

## Scope

### App changes

1. Server/mock audit hardening
   - Keep mock server available for explicit local/dev mode.
   - Add a small runtime helper that can report whether the app is using server or mock mode.
   - Add documentation/verification notes explaining why mock code may exist in the JS bundle but should not be selected at runtime in server mode.

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
   - search built bundle for `/api/soundlog` and runtime `apiSource: "server"`

## Non-goals for this first loop

- Implement actual audio preview playback.
- Implement Spotify/Melon SDK streaming.
- Remove all track metadata links from seed data.
- Remove server-side music platform endpoints, because they may remain backward-compatible and are not user-facing after this app change.

## Risks

- Removing `expo-web-browser` is safe only if no other active route imports it.
- Some users may still expect a persistent mini-player; it should become a selected-track/external-open panel rather than a streaming control.
- The server seed data intentionally resembles mock data, so visual similarity alone does not prove mock usage.

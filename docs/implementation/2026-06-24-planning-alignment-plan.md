# Soundlog Planning Alignment Implementation Plan

## Goal

Bring the current app closer to the product/frontend planning docs before EC2/IP-based real-device testing.

## Scope

- Frontend: React Native/Expo app under `soundlog/`.
- Server: only small API contract fixes if the existing server endpoint cannot support the frontend flow.

## Feature Contract

### Recap generation after trip end

- User goal: end a travel session and immediately see a Recap based on saved moments.
- Entry: Travel screen end-session confirmation.
- Exit: Recap share screen for the generated server recap, or a local session recap fallback.
- State: `session`, local `momentLogs`, recap creation loading/error state.
- API: `POST /v1/recaps` with `sessionId`, `momentLogIds`, `templateId`, title, representative track.
- Fallback: if unauthenticated/API fails/no server moments exist, navigate to the local session recap id.
- Error/empty: if no moments exist, end travel but route to Recap tab with an empty/guide state.

### Bottom tab IA

- User goal: discover Recap as a primary app area.
- Change: show `Home / Recap / Library / My` as tabs; keep camera as a center FAB-style tab button that routes to `/camera` but hide the placeholder `capture` route label.
- State: camera action still prompts to start travel if no active session.

### Music playback and external platform behavior

- User goal: understand that Soundlog opens available external music links/searches instead of pretending to stream full tracks.
- Change: keep local mini-player as contextual preview/control UI, add explicit external-open action in full player, use existing platform URL utility, log skip events for next/previous.
- Error: show an inline message when the external URL cannot open.

### Moment capture edit and retry

- User goal: correct place/mood/music before saving, and not lose a failed upload.
- Change: allow editing place name, mood chips, and “music 없음” on review. Save edited values in the local log and API payload.
- Retry: add store helpers to update sync status and retry failed logs from Travel recent moments.
- Error: failed retry remains visible with status.

### Like/save rollback

- User goal: UI should not silently diverge from server state.
- Change: wrap optimistic like/save updates with rollback on API failure in Playlist, MiniPlayer, and Library.
- Feedback: show a small inline message in Playlist/MiniPlayer/Library action menus when rollback happens.

### Library saved playlists

- User goal: distinguish saved tracks from saved playlist contexts.
- Change: add a lightweight "저장한 PL" tab derived from saved tracks grouped by playlist id, without inventing a new server contract.
- Server sync: keep existing track-state API; a full playlist-library API is out of scope for this pass.

### Travel session model persistence

- User goal: session recap remains coherent across app restart.
- Change: persist current location/current place/selected mode in `travelSessionStore`; expose selected moods via saved moment logs for recap generation.

## Files

- `src/components/navigation/BottomNavigation.tsx`
- `src/store/travelSessionStore.ts`
- `src/store/momentLogStore.ts`
- `src/api/recapApi.ts`, `src/api/recapQueries.ts`
- `src/components/travel/*`
- `src/components/moment-capture/*`
- `src/components/playlist/PlaylistCurationScreen.tsx`
- `src/components/MiniPlayer.tsx`
- `src/components/library/*`
- `src/utils/musicPlatformLinks.ts` if needed

## Verification

- Typecheck/lint for frontend.
- Smoke-check key flows by reading route contracts:
  - start travel -> capture moment -> failed/synced local state
  - end travel -> create/fallback recap -> share screen
  - Recap tab visible
  - like/save rollback compile path
  - external open action compile path

## Risks

- The server stores uploaded moment photos as multipart files; local-only failed logs cannot be referenced by server recap until retry succeeds.
- Track ids from local/mocked recommendations may not always exist in server DB, so recap creation should include a fallback to local recap.
- True audio streaming remains out of scope; UI must present external opening clearly.

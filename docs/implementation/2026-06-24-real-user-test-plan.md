# Real User Flow Test Fix Plan

## Goal

Test Soundlog from a fresh user state and fix P3 or higher issues found during the flow.

## Tested Flow

1. Fresh browser storage.
2. Login screen.
3. Continue as guest.
4. Four-step onboarding.
5. Home recommendations.
6. Playlist/playback path.
7. Recap, Library, My tabs.
8. Center camera action.

## Findings To Fix

### P1: EC2 API CORS blocks dev web origins

- Symptom: Home featured playlist and mood recommendation requests fail from `http://localhost:8082`.
- Root cause: server CORS response only allows `http://localhost:8081`.
- Fix: support comma-separated `CLIENT_URLS`, keep `CLIENT_URL` compatibility, allow common localhost Expo web dev origins in non-production, and update env examples.
- Verification: `OPTIONS` request from `http://localhost:8082` returns the same origin in `Access-Control-Allow-Origin`.

### P2: Center camera action does not progress on web before travel starts

- Symptom: Clicking the center camera button while no session is active leaves the user on the same tab during web testing.
- Root cause: `Alert.alert` is not a reliable progression surface on web/headless testing.
- Fix: route directly to `/camera`; the camera screen already has a start-travel prompt when no session is active.
- Verification: clicking the center button navigates to `/camera` and shows the "여행을 먼저 시작해요" prompt.

## Non-fix Notes

- Native camera capture cannot be fully validated in Expo web; verify the route and start prompt on web, then use Dev Build for camera permissions.
- Browser plugin setup failed due tool metadata; Playwright was installed only in `/tmp` for this test and does not touch repo dependencies.

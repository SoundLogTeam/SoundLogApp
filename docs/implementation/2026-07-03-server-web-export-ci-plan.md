# 2026-07-03 Server Web Export CI Plan

## Goal

Keep the frontend from regressing to mock API mode or reintroducing removed music streaming/Spotify routes after PR review and future changes.

## User Outcome

- The Vercel/web build is compiled with `EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server`.
- The compiled web bundle points API requests at `/api/soundlog`.
- The app no longer ships Spotify auth/playback route markers in the web bundle.
- PR checks fail before merge if these deployment-critical assumptions are broken.

## Scope

- Add a Node script that runs a server-mode Expo web export into a temporary directory.
- Inspect the generated JS bundles for server API markers and removed streaming markers.
- Add an npm script for local/CI use.
- Run the new check in the GitHub PR workflow after typecheck.

## Non-goals

- Do not add browser E2E tests in this slice.
- Do not merge PRs.
- Do not change Vercel domain/DNS settings from code.
- Do not require live EC2 API access in CI; this check validates the compiled app contract.

## Files

- `scripts/check-server-web-export.js`
- `package.json`
- `.github/workflows/pr-check.yml`

## Verification

- `npm run check:server-web-export`
- `npm run typecheck`
- `git diff --check`
- PR #14 checks pass after push.

## Risks

- Expo export can add CI time, but it is the closest automated proof that the deployed web bundle is server-mode.
- Bundle text is minified, so the script should check robust markers such as `/api/soundlog`, `apiSource:'server'` or equivalent, and absence of `spotify-auth`.

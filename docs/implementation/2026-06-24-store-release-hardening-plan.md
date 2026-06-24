# Store release hardening plan

## Goal

Reduce App Store and Play Store submission blockers in the current Soundlog app by making production builds safer, narrowing native permissions, exposing privacy/account controls, and adding automated release checks.

## Feature contract

- User goal: install a store build that connects to the real Soundlog service, explains privacy/account handling, and asks only for permissions tied to visible app features.
- Entry points: login screen, My tab, native permission prompts, EAS production build.
- Exit points: app can still run in development/preview with the current EC2 demo, while production builds fail fast when required release inputs are missing.
- Screens/components affected:
  - `app.config.js`
  - `eas.json`
  - `app/auth/login.tsx`
  - `src/components/my/AuthAccountCard.tsx`
  - new legal information routes/components
- Required state:
  - account status from `authStore`
  - no new persisted user data for legal screens
- API expectations:
  - production app requires HTTPS `EXPO_PUBLIC_SOUNDLOG_API_BASE_URL`
  - account deletion is a support/request flow until a server delete endpoint exists
- Local persistence:
  - no change to existing auth/library/travel persistence
- Permission requirements:
  - keep camera, foreground location, and photo-library image access
  - remove microphone, audio media, video media, external storage, and overlay permissions from release config
- Loading/empty/error/offline states:
  - legal screens are static and offline-safe
  - account deletion request uses email/web fallback and shows unavailable copy if no handler exists
- Analytics/recommendation events:
  - no new tracking events in this slice

## Implementation steps

1. Harden frontend native config.
   - Use the opaque `assets/icon.png` for the app icon.
   - Keep adaptive icon foreground separate for Android.
   - Add `android.blockedPermissions` for unused sensitive permissions.
   - Keep HTTP cleartext/ATS exceptions only for non-production builds that explicitly point to HTTP.
   - Add production env placeholders that require HTTPS and disable dev auth fallback.

2. Add store release guardrails.
   - Add `scripts/check-store-release.js`.
   - Validate production EAS env is HTTPS, dev auth fallback is not enabled, app icon has no alpha, Android blocked permissions are present, and production does not request HTTP cleartext.
   - Add an npm script for this check.

3. Add user-visible policy/account controls.
   - Add Terms and Privacy screens.
   - Link them from login and My.
   - Add account deletion request entry in My. Until the server has a delete endpoint, open a support mailto/web URL and document that this is a request flow.

4. Update server release documentation.
   - Add production env checklist for HTTPS URLs, `NODE_ENV=production`, `USE_MOCK_DB=false`, OAuth client IDs, and DB migration/seed requirements.
   - Add a small server env check script if it can be done without new dependencies.

## Verification

- Frontend:
  - `npm run typecheck`
  - `npm run doctor`
  - `npm run check:store-release`
  - `EXPO_NO_DOTENV=1 npx expo export --platform all --output-dir /tmp/soundlog-export`
- Server:
  - `npm run typecheck`
  - `USE_MOCK_DB=true npm run test:api`
  - `npm run build`

## Risks and blockers

- Real OAuth provider configuration is still required before production social login can pass review.
- A real HTTPS API domain is still required before a store build can connect to production.
- Account deletion should become an in-app server-backed flow once a delete endpoint exists.

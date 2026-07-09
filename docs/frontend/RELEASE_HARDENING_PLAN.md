# Soundlog release hardening plan

## Goal

Move the current EC2-connected demo from "mock-auth integration works" toward a release-safe baseline by removing production mock-login paths, storing native auth tokens in secure storage, serializing refresh retries, aligning Expo SDK patch versions, and clearing known server upload dependency advisories.

## Scope

- Frontend auth/session safety:
  - Store persisted auth session through native secure storage on iOS/Android and keep AsyncStorage only as the web fallback.
  - Keep the current mock social-login path available for development/integration builds only.
  - Prevent production builds from silently sending mock provider tokens.
  - Serialize concurrent access-token refresh requests to avoid refresh-token rotation races.
- Frontend release config:
  - Remove unconditional iOS ATS arbitrary-loads config from the committed app config.
  - Align Expo SDK 56 package patch versions so `expo-doctor` passes.
- Server safety:
  - Make `ALLOW_DEV_AUTH_FALLBACK` ineffective in `NODE_ENV=production`.
  - Update `multer` to a patched version.
  - Document production env requirements: real OAuth client IDs, HTTPS public base URL, dev fallback off.
- Verification:
  - Frontend: `npm run typecheck`, `npx expo-doctor`, `npm audit --audit-level=moderate`.
  - Server: `pnpm typecheck`, `pnpm test:api`, `pnpm build`, `pnpm audit --audit-level moderate`.

## Non-goals for this slice

- Provisioning a real domain, certificate, ALB/Nginx/CloudFront, or Route53 records.
- Implementing full provider OAuth with Google/Kakao/Apple credential setup.
- Flipping the currently running EC2 integration server to production-safe auth, because the app still depends on dev fallback until real OAuth credentials exist.
- Full travel-session and Recap server synchronization; those remain follow-up product/data-flow work.

## Implementation notes

- Add `expo-secure-store` using Expo's installer so native module versions match the SDK.
- Keep `mock-*` provider-token generation behind a dev-only helper. Production builds should surface a clear login unavailable state until real OAuth is configured.
- Keep web behavior compatible with current browser/mock workflows.
- Avoid top-level use of native-only APIs in code that web can load; secure storage should lazy-load `expo-secure-store` only on native.
- Server tests should continue to pass in `NODE_ENV=test`, where dev fallback remains allowed for API integration tests.

## Remaining external blockers

- Real provider client IDs and redirect URIs.
- HTTPS API URL and upload public base URL.
- EAS production profile secrets.
- Decision on whether login-before-signup local data migration is automatic or user-confirmed.

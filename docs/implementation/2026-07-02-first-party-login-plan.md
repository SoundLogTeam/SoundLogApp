# First-party login plan

## Goal

Remove Apple/Kakao login from Soundlog and make the app use a first-party email/password account flow only, while preserving the existing Soundlog access/refresh token session model.

## Contract

- User goal: create or access a Soundlog account without an external identity provider.
- Entry point: `/auth/login`.
- Exit point: after successful login or signup, route to onboarding if incomplete, otherwise home.
- Required state: `authStore.finishLogin(session)` stores access token, refresh token, user, and last provider.
- API expectations:
  - `POST /v1/auth/login` with `{ email, password }`.
  - `POST /v1/auth/register` with `{ email, password, displayName? }`.
  - Existing `POST /v1/auth/refresh`, `POST /v1/auth/logout`, `GET /v1/me` stay unchanged.
- Persistence: the server stores a password hash only. The client stores only Soundlog session tokens through the existing auth storage.
- Permission requirements: none. External native auth capabilities are removed from the primary login flow.
- Loading/error/offline states:
  - The form shows pending state while submitting.
  - Validation errors stay local when possible.
  - Server/auth failures render in the existing login error area.
  - App browsing requires an authenticated session.

## Implementation

### Server

1. Add `passwordHash String?` to `User` and a migration.
2. Add auth validators for `loginBody` and `registerBody`.
3. Add `authService.login` and `authService.register`.
   - Normalize email with trim/lowercase.
   - Use `provider = "email"` and `providerUserId = normalizedEmail`.
   - Hash passwords with bcrypt.
   - Reject duplicate email on register.
   - Reject invalid email/password on login.
4. Add routes:
   - `POST /v1/auth/login`
   - `POST /v1/auth/register`
5. Keep social-login implementation only if needed for backward compatibility tests, but do not expose it in the app.

### Frontend

1. Replace Apple/Kakao buttons in `app/auth/login.tsx` with an email/password form.
2. Add a segmented login/signup mode.
3. Update `src/types/auth.ts`, `src/api/authApi.ts`, `src/api/authQueries.ts`, and `src/mock-server/authHandlers.ts` for first-party login/register requests.
4. Remove unauthenticated browsing from the login entry point.
5. Update account provider labels to show a Soundlog account rather than Apple/Kakao.
6. Remove native social login config/dependencies from the primary app config path.

## Verification

- Frontend: `npm run typecheck`.
- Server: `npm run typecheck`.
- Server: `USE_MOCK_DB=true npm run test:api`.
- Targeted API checks for login/register validation if needed.

## Risks

- Existing accounts created through social providers will not be reachable by email/password unless migrated separately.
- The current deployed database needs the new `passwordHash` migration before server deployment.
- Web and native builds should be checked because removing native-only social login simplifies the UI but may leave stale config references.

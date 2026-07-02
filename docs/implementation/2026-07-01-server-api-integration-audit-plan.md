# Server API integration audit plan

## Goal

Make the Soundlog frontend clearly use the deployed server when configured for server mode, and audit whether fetch/auth/TanStack Query behavior is appropriate now that the backend is deployed.

## Current evidence

- Local app env points to the deployed server:
  - `EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=http://52.79.185.121:4000`
- The deployed server responds, and `/v1/health` now returns `database: "ok"` after disabling mock DB mode on EC2.
- Before this change, EAS `development` and `preview` profiles pointed to the old unreachable IP `http://54.226.62.131:4000`.
- Frontend API modules use the app's shared `fetch` wrapper in `src/api/client.ts`, not axios.
- Authenticated requests attach `Authorization: Bearer <accessToken>` and retry once after `POST /v1/auth/refresh` on 401.
- Several server-mode API calls silently fall back to in-app mock data on server failures:
  - `src/api/homeApi.ts`
  - `src/api/playlistApi.ts`
  - `src/api/tourApi.ts`
  This can make a deployed-server failure look like the frontend is still using mock DB.

## Implementation plan

1. Keep the app's current `fetch` client rather than adding axios.
   - Rationale: the app already has a typed shared fetch wrapper, token injection, JSON/FormData handling, idempotency headers, and refresh retry.
   - Adding axios just for auth would duplicate behavior and increase dependency surface.

2. Stop silent mock fallback when the app is configured for server mode.
   - In server mode, public reads such as home, playlist detail, contextual playlist, and nearby places should surface a network/API error to React Query.
   - Keep mock data only when `EXPO_PUBLIC_SOUNDLOG_API_SOURCE=mock` or no server base URL is configured.
   - This preserves explicit mock testing while making misconfigured server deployments visible.

3. Align dev/preview EAS server URL with `.env.local`.
   - Update `eas.json` development and preview API base URL from `54.226.62.131` to `52.79.185.121`.
   - Disable dev auth fallback for dev/preview builds now that the deployed server runs in real DB mode, and enable real social login.
   - Update README test-server notes to match.
   - Production remains HTTPS-only and should still require a proper production API base URL outside the profile file.

4. Improve TanStack Query boundaries only where clearly needed.
   - Leave existing QueryClient defaults in place: retry 1, default staleTime 1 minute.
   - Add shared query keys/hooks for library tracks if we need cache invalidation after mutations.
   - Do not move client-only Zustand state into TanStack Query.

5. Verify auth behavior through current code and live server probes.
   - Confirm unauthenticated protected endpoints return 401.
   - Confirm `requestApi` sets Authorization for authenticated app sessions and refreshes once on 401.
   - Confirm logout/refresh/social-login intentionally use `auth: false`.
   - Note that login depends on valid Apple/Kakao provider credentials unless dev auth fallback is enabled.

6. Verification commands.
   - `npm run typecheck`
   - Targeted curl probes:
     - `GET /v1/health`
     - public home endpoints
     - protected endpoint without token
   - Report the deployed backend health response and whether Vercel web routes through the server proxy after deployment.

## Risks and non-goals

- If EC2 is reconfigured back to `USE_MOCK_DB=true`, the frontend cannot fix that alone; the deployed server environment must stay in real DB mode.
- HTTP IP API is acceptable for dev/preview testing, but production builds require HTTPS by existing app config.
- If users need guest mode to show sample content while server is down, that should be a deliberate product fallback, not an accidental catch-all mock fallback in server mode.

## 2026-07-01 execution notes

- EC2 `soundlog-api.service` was using `/opt/soundlog/app/.env` with `USE_MOCK_DB=true` and `ALLOW_DEV_AUTH_FALLBACK=true`.
- Backed up the server `.env`, changed both values to `false`, ran `pnpm db:deploy`, and restarted `soundlog-api.service`.
- Public health now returns `{"database":"ok"}` instead of `{"mode":"mock-db"}`.
- Fake provider-token login is now rejected, so dev/preview builds must not enable `EXPO_PUBLIC_ENABLE_DEV_AUTH_FALLBACK`.
- Nearby places can still contain `source: "mock"` because the real DB seed data uses that source value when Tour API returns no items. That is Postgres seed/fallback data, not the app's in-memory mock server.

## 2026-07-02 Vercel web audit notes

- Live Vercel bundle at `https://sound-log-app.vercel.app/` does not contain `52.79.185.121`, `EXPO_PUBLIC_SOUNDLOG_API_BASE_URL`, or any server base URL.
- The same bundle does contain Soundlog API paths and `mockServer`, so the deployed web build was compiled without server env and can fall back to in-app mock behavior.
- Because Vercel serves HTTPS, direct browser fetches to `http://52.79.185.121:4000` can be blocked as mixed content.
- Plan:
  - Add a Vercel rewrite from `/api/soundlog/:path*` to `http://52.79.185.121:4000/:path*`.
  - Build Vercel web with `EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server` and `EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog`.
  - Make explicit server mode fail loudly if API base URL is absent instead of silently using mock.

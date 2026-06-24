# iOS Apple + Kakao Social Login Plan

## Goal

iOS 앱에서 실제 소셜 로그인 진입점을 Apple과 Kakao 두 개로 제한한다. Google 버튼은 사용자 플로우에서 제거하고, 게스트 둘러보기는 유지한다. 키가 없는 개발/프리뷰 환경에서는 dev fallback 또는 안내 상태로 앱이 깨지지 않아야 한다.

## Contract

- User goal: iOS 사용자가 Apple 또는 Kakao 계정으로 Soundlog 서버 세션을 만든다.
- Entry point: `/auth/login`의 provider 버튼.
- Exit point: 로그인 성공 후 온보딩 미완료 사용자는 `/onboarding`, 완료 사용자는 홈.
- Required state: `authStore.finishLogin(session)`으로 access/refresh token, user, last provider 저장.
- API expectation: `POST /v1/auth/social-login`
  - Apple: `provider=apple`, `idToken`, optional `authorizationCode`, optional first-login display name.
  - Kakao: `provider=kakao`, `providerAccessToken`, optional `idToken`.
- Persistence: provider token은 앱에 장기 저장하지 않고 서버 세션으로 즉시 교환한다.
- Permissions/native capability:
  - Apple: `expo-apple-authentication`, `ios.usesAppleSignIn=true`, Apple Sign In entitlement.
  - Kakao: `@react-native-kakao/core`, `@react-native-kakao/user`, Kakao native app key, iOS bundle id 등록, Kakao URL scheme.
- Loading/error/offline:
  - 로그인 중 버튼 pending 표시.
  - 사용자가 provider 화면을 닫으면 세션을 `unauthenticated`로 되돌리고 취소 안내만 표시.
  - provider/key 미설정은 버튼 대신 설정 필요 안내 또는 dev fallback으로 처리.
  - 네트워크/서버 실패는 기존 로그인 실패 메시지 유지.

## Implementation

### Frontend

1. Dependencies
   - Add `expo-apple-authentication`.
   - Add `@react-native-kakao/core` and `@react-native-kakao/user`.

2. App config
   - Enable Apple Sign In capability in `app.config.js`.
   - Add `expo-apple-authentication` plugin.
   - Add Kakao config plugin only when `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` is present.
   - Keep app buildable without the Kakao key, but make release check fail until the key is supplied.
   - Add Kakao Maven repo through `expo-build-properties` for Android build compatibility even though this task is iOS-first.

3. Native iOS project
   - Add Apple Sign In entitlement to the existing iOS project because this repo already has an `ios/` directory.
   - Add `CFBundleAllowMixedLocalizations`.
   - Do not hardcode an unknown Kakao key in native plist; rely on Expo prebuild/config plugin once the key is issued, and document that a native rebuild/prebuild is required after setting it.

4. Login implementation
   - Create a provider helper under `src/auth/` or `src/services/` with lazy native imports.
   - Apple helper:
     - Guard iOS only.
     - Call `AppleAuthentication.signInAsync` with full name/email scopes.
     - Send `identityToken` to server.
   - Kakao helper:
     - Guard iOS only for this MVP.
     - Initialize Kakao SDK lazily with `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`.
     - Prefer KakaoTalk when available, otherwise Kakao Account login.
     - Send Kakao access token to server.
   - Update `/auth/login` provider list to Apple + Kakao only.
   - Keep dev fallback login behavior for local/dev testing.

5. Release checks/docs
   - `check:store-release` should require:
     - social login enabled in production,
     - Kakao native app key,
     - Apple Sign In config/plugin,
     - Kakao config plugin when key exists.
   - README/env examples should describe required Apple/Kakao keys.

### Server

1. Auth DTO
   - Accept optional `providerDisplayName` for verified Apple native credentials.

2. Kakao verification hardening
   - Add `KAKAO_APP_ID` env.
   - In production, require `KAKAO_APP_ID` before accepting Kakao login.
   - Call Kakao access token info API and verify `app_id` matches `KAKAO_APP_ID`.
   - Keep existing user info API call for provider user id/display name.

3. Production checks
   - Replace production requirement for `GOOGLE_CLIENT_ID` with `KAKAO_APP_ID`.
   - Keep Google verifier code untouched for compatibility, but do not expose Google in the app.

## Risks

- Kakao native login cannot be fully verified until a Kakao native app key is issued and registered with bundle id `com.mannomi.soundlog`.
- Existing `ios/` directory means config plugin output may not affect the checked-in native project unless we run prebuild or manually patch generated files after the key is known.
- Apple login requires Apple Developer capability and a real EAS/standalone build for reliable verification.

## Verification

- Frontend:
  - `npm install` / Expo dependency install.
  - `npm run typecheck`.
  - `npm run doctor`.
  - `npm run check:store-release` should fail without real production URLs/keys and pass with fake HTTPS URLs plus a fake Kakao key.
  - `EXPO_NO_DOTENV=1 npx expo export --platform all --output-dir /tmp/soundlog-export`.
- Server:
  - `npm run typecheck`.
  - `USE_MOCK_DB=true npm run test:api`.
  - `npm run build`.
  - `NODE_ENV=production ... npm run check:production-env` with Apple/Kakao env.

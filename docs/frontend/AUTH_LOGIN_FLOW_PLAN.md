# Soundlog 로그인/소셜 로그인 구현 계획

## 1. 목표

Soundlog에 계정 로그인을 붙이는 인증 플로우를 설계한다. 현재 MVP 정책은 게스트 사용을 제공하지 않고, 온보딩 소개와 약관 확인을 제외한 주요 앱 기능을 로그인 후 사용할 수 있게 한다.

핵심 목표:

- 소셜 로그인 제공자를 쉽게 추가할 수 있는 인증 레이어 구축
- 앱 시작 시 세션 복구, 로그인 필요 여부, 온보딩 완료 여부를 안정적으로 분기
- 기존 로컬 취향/여행 로그/좋아요 데이터를 로그인 후 서버 계정으로 이관할 수 있는 구조 마련
- 웹, iOS, Android에서 모두 테스트 가능한 mock auth 플로우 제공

## 2. 추천 UX 정책

### 2.1 MVP 권장안

로그인은 필수 진입 장벽으로 둔다. 사용자는 온보딩 소개 화면에서 제품 개념을 확인할 수 있지만, 홈/추천/기록/Recap 같은 주요 기능은 Soundlog 계정 로그인 후 사용할 수 있다.

이유:

- 여행 기록과 Recap은 계정에 보존되어야 사용자가 데이터 유실을 덜 걱정한다.
- 공동 Recap, Live Sound Map, 음악 취향 매칭은 계정 식별과 신고/차단 정책이 필요하다.
- 기존 기기에 남아 있는 로컬 기록은 로그인 후 서버 동기화를 시도한다.

권장 제한:

- 로그인 전 가능: 온보딩 소개, 약관/개인정보 처리방침 확인, 로그인/가입
- 로그인 필수: 홈 추천, 음악 선택, Moment 저장, Recap, 보관함, 공동 여행방, Live Sound Map, 매칭

### 2.2 진입 플로우

1. 앱 실행
2. 로컬 auth store hydration
3. 서버 refresh token이 있으면 세션 복구 시도
4. 세션 복구 성공:
   - 온보딩 완료 여부 확인
   - 완료 전이면 `/onboarding`
   - 완료 후면 `/(tabs)`
5. 세션 없음:
   - `/auth/login` 진입
   - 사용자는 로그인 또는 가입 선택
6. 온보딩 미완료:
   - 로그인 성공 후 `/onboarding`에서 취향/권한 설정 진행

## 3. 화면/라우팅 설계

### 신규 라우트

- `app/auth/login.tsx`
  - 로그인/가입 CTA
  - 약관/개인정보 처리 링크
  - 로그인 실패/취소 상태 표시

- `app/auth/callback.tsx`
  - 웹 OAuth callback 처리용
  - native에서는 `expo-auth-session` redirect 결과를 login 화면에서 처리하되, 웹 호환을 위해 route 유지

### 수정 라우트

- `app/_layout.tsx`
  - Stack에 `auth/login`, `auth/callback` 추가

- `app/(tabs)/index.tsx`
  - 현재는 온보딩만 gate 처리
  - 인증 hydration과 onboarding hydration을 함께 고려하는 `AuthGate` 또는 `AppEntryGate`로 이동 권장

- `app/onboarding.tsx`
  - 로그인 직후 처음 진입하는 경우와 온보딩 재진입을 구분
  - 온보딩 완료 후 서버 프로필 저장 mutation 호출 가능하게 확장

- `app/(tabs)/my.tsx`
  - 상단에 계정 카드 추가
  - 로그인 상태: 이름/이메일/제공자/동기화 상태/로그아웃
  - 로그아웃 상태: 로그인 유도 CTA

## 4. 상태 관리 설계

### 신규 store

`src/store/authStore.ts`

상태:

- `status`: `checking | authenticated | unauthenticated`
- `user`: `AuthUser | null`
- `accessToken`: 메모리 중심 보관
- `refreshTokenStored`: boolean
- `lastLoginProvider`
- `isHydrated`

액션:

- `restoreSession()`
- `signInWithProvider(provider)`
- `finishLogin(session)`
- `logout()`
- `clearAuthError()`

저장 정책:

- access token: 메모리/Zustand
- refresh token: `expo-secure-store`
- last provider: AsyncStorage 가능

웹 주의:

- `expo-secure-store`는 web fallback이 제한적이므로, 웹에서는 mock 또는 secure-cookie 기반 서버 세션을 권장한다.
- MVP 웹 테스트는 mock auth + memory session으로 시작한다.

## 5. API 계약 설계

프론트 API 모듈:

- `src/api/authApi.ts`
- `src/api/authQueries.ts` 또는 mutation hooks
- `src/mock-server/authHandlers.ts`

필요 endpoint 초안:

### `POST /v1/auth/social-login`

소셜 제공자 인증 결과를 서버 세션으로 교환한다.

Request:

```json
{
  "provider": "google",
  "authorizationCode": "provider-authorization-code",
  "idToken": "provider-id-token",
  "providerAccessToken": "provider-access-token-if-required",
  "codeVerifier": "pkce-code-verifier-if-required",
  "redirectUri": "soundlog://auth/callback",
  "device": {
    "platform": "ios",
    "appVersion": "1.0.0"
  }
}
```

Response:

```json
{
  "accessToken": "soundlog-access-token",
  "refreshToken": "soundlog-refresh-token",
  "expiresIn": 3600,
  "user": {
    "id": "user_123",
    "displayName": "만욱",
    "email": "user@example.com",
    "profileImageUrl": "https://..."
  },
  "profile": {
    "completedOnboarding": false,
    "preferredGenres": [],
    "preferredMoods": [],
    "travelStyles": [],
    "companionType": null,
    "locationRecommendationEnabled": true
  },
  "isNewUser": true
}
```

주의:

- OAuth 제공자마다 교환 값이 다르므로 `authorizationCode`, `idToken`, `providerAccessToken`을 모두 필수로 만들지 않는다.
- Google/Apple은 가능하면 authorization code 또는 id token을 서버에서 검증한다.
- Kakao는 access token 검증 방식이 필요할 수 있으므로 provider별 validator를 서버에 둔다.
- provider token은 클라이언트에 장기 저장하지 않고 서버 세션으로 즉시 교환한다.

### `POST /v1/auth/refresh`

refresh token으로 access token을 갱신한다.

### `POST /v1/auth/logout`

서버 refresh token을 무효화한다. 실패해도 클라이언트 로컬 세션은 정리한다.

### `GET /v1/me`

현재 로그인 사용자와 서버 프로필을 조회한다.

### `PATCH /v1/me/profile`

온보딩/취향 정보를 서버에 저장한다.

### `POST /v1/me/migrate-local-data`

로그인 전 로컬로 만든 로그, 좋아요, Recap 초안을 로그인 계정으로 이관한다.

## 6. 소셜 로그인 제공자 전략

### MVP 1순위

- Apple
- Google
- Kakao

이유:

- iOS에서 다른 소셜 로그인을 제공하면 Apple 로그인을 함께 제공해야 할 가능성이 높다.
- Google은 Expo/AuthSession 예제가 많아 초기 검증이 쉽다.
- Kakao는 국내 사용자에게 익숙하지만 native/web redirect, SDK, 백엔드 검증 정책을 별도로 확인해야 한다.

### 구현 방식

MVP는 `expo-auth-session` 기반 OAuth redirect를 기본으로 둔다.

추가 패키지 후보:

- `expo-auth-session`
- `expo-web-browser`
- `expo-secure-store`
- `expo-apple-authentication`

주의:

- provider client id, redirect URI, bundle id/package name은 EAS 환경 변수와 app config로 분리한다.
- provider token을 앱에서 장기 보관하지 않고 서버로 즉시 교환한다.
- redirect URI는 `AuthSession.makeRedirectUri()`로 플랫폼별 값을 만들고, native scheme과 web origin을 분리한다.
- iOS/Android dev build, Expo Go, web은 redirect URI가 달라질 수 있으므로 provider 콘솔에 환경별 URI를 등록한다.

## 7. 기존 로컬 데이터와의 연결

로그인 전 생성될 수 있는 데이터:

- `userProfileStore`
- `musicPlatformStore`
- `momentLogStore`
- `libraryStore`
- `travelSessionStore`
- `recommendationEventStore`

로그인 성공 후 정책:

1. 서버 프로필이 비어 있고 로컬 프로필이 있으면 로컬 값을 서버에 업로드
2. 서버 프로필이 있고 로컬 프로필도 있으면 충돌 해결 필요
3. 로컬 순간 저장/좋아요/Recap 초안은 migration endpoint로 전송
4. migration 성공 후 로컬 데이터 삭제가 아니라 `syncedAt` 표시를 우선 적용

충돌 해결 기본안:

- 서버 프로필이 최신이면 서버 우선
- 로컬 데이터가 더 최근이면 사용자에게 “이 기기의 취향으로 덮어쓰기” 선택지 제공
- MVP에서는 마이페이지에서 수동 동기화 버튼으로 단순화 가능

## 8. 에러/엣지케이스

- 사용자가 소셜 로그인 창을 닫음: 취소 상태로 복귀, 에러 토스트 대신 조용한 안내
- 네트워크 실패: 재시도 CTA 제공, 앱 주요 기능 진입은 로그인 성공 후 허용
- refresh 실패: access token 정리 후 unauthenticated 상태
- 서버는 로그인 성공, 프로필 저장 실패: 로그인 유지, 온보딩 데이터는 로컬 보관 후 재시도
- 로그아웃 실패: 서버 실패와 무관하게 로컬 토큰 삭제
- 앱 삭제/재설치: SecureStore 토큰 없음, 재로그인 필요
- 웹 배포: native provider SDK 의존 기능은 mock/fallback UI 필요
- Apple/Google/Kakao 중 일부 provider 미설정: 버튼 비활성 + dev manager에서 mock login 가능

## 9. 구현 순서

### Phase 1. Mock 기반 인증 골격

1. `authStore` 추가
2. `authApi`, `authHandlers`, mock endpoint id 추가
3. `/auth/login` 화면 추가
4. App entry gate 추가
5. 마이페이지 계정 카드 추가
6. DevTestManager에 로그인/로그아웃/세션 만료 시뮬레이션 추가
7. 401/refresh 실패 시나리오를 mock으로 테스트 가능하게 구성

검증:

- 로그아웃 상태에서 주요 앱 기능 진입 차단
- mock Google/Kakao/Apple 로그인
- 로그인 후 온보딩 이동
- 온보딩 완료 후 홈 이동
- 로그아웃 후 로그인 화면 이동
- 네트워크 실패 상태
- refresh 실패 후 로그인 화면 전환
- 이미 로그인된 사용자가 `/auth/login`에 접근했을 때 홈으로 복귀

### Phase 2. API 문서화와 서버 DTO 반영

1. `api-docs`에 auth endpoint 추가
2. `SoundLogServer`에 validator/service/mock auth DTO 추가
3. refresh/logout/me/profile 계약 정렬

검증:

- OpenAPI YAML 검증
- 서버 typecheck
- mock response와 app 타입 일치 확인

### Phase 3. 실제 provider 연결

1. `expo-auth-session`, `expo-web-browser`, `expo-secure-store` 설치
2. app config에 redirect scheme/plugin/env 추가
3. Google OAuth dev client 검증
4. Apple 로그인 iOS dev build 검증
5. Kakao provider 검증
6. provider token을 서버 session으로 교환

검증:

- iOS dev build
- Android dev build
- web mock/fallback
- 로그인 취소/실패/재시도

## 10. 구현 리스크와 보강안

### 10.1 AuthGate redirect loop 방지

앱 진입 시 auth hydration, profile hydration, route replace가 동시에 발생하면 `/auth/login`, `/onboarding`, `/(tabs)` 사이에 redirect loop가 생길 수 있다.

보강안:

- `AuthGate`는 `auth.isHydrated`와 `profile.isHydrated`가 모두 true가 된 뒤에만 redirect한다.
- 현재 path가 `auth/*`인지, `onboarding`인지 확인한 뒤 필요한 경우에만 replace한다.
- `authenticated`지만 `completedOnboarding=false`이면 `/onboarding`으로 보낸다.
- `unauthenticated`이면 온보딩 소개, 로그인, 약관 화면만 허용한다.

### 10.2 API 401 처리

access token 만료 시 여러 query/mutation이 동시에 refresh를 호출할 수 있다.

보강안:

- API client 레이어에서 access token 주입과 401 처리를 한 곳으로 모은다.
- refresh 요청은 단일 promise로 묶어 중복 호출을 방지한다.
- refresh 실패 시 auth store를 `unauthenticated`로 전환하고 민감한 토큰을 삭제한다.

### 10.3 SecureStore와 web fallback

`expo-secure-store`는 native 보관에 적합하지만 web에서는 같은 보안 수준을 기대하기 어렵다.

보강안:

- native: refresh token은 SecureStore
- web MVP: mock auth 또는 memory session
- web production: 백엔드 httpOnly secure cookie 기반 세션 검토

### 10.4 로그인 전 로컬 데이터 이관

로그인 전 로컬에 남은 데이터가 로그인 후 중복 생성될 수 있다.

보강안:

- 로컬 로그/좋아요/Recap에는 `localId`, `createdAt`, `syncedAt`을 둔다.
- migration endpoint는 idempotency key를 받는다.
- migration 성공 후 즉시 삭제하지 않고 `syncedAt` 표시로 남긴다.

## 11. 구현 전 확인 질문

아래 항목은 제품 정책에 영향을 주므로 구현 전에 결정이 필요하다.

1. MVP에서는 로그인을 필수로 막고, 온보딩 소개와 약관만 로그아웃 상태에서 접근할 수 있게 합니다.
2. 1차 소셜 로그인 제공자는 무엇으로 갈까요? 권장안은 Apple, Google, Kakao입니다.
3. 로그인 전 만든 여행 로그/좋아요/Recap은 로그인 후 자동 이관할까요, 사용자 확인 후 이관할까요?
4. 로그아웃 시 로컬 여행 기록은 유지할까요, 모두 삭제할까요?
5. 실제 소셜 OAuth는 이번 작업에서 붙일까요, 아니면 mock auth 골격과 API 계약까지만 먼저 갈까요?

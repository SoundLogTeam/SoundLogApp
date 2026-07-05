# Soundlog Mock Server

실제 서버가 없던 초기 PoC 단계에서 사용하던 앱 내부 mock server입니다.

현재 앱 API facade(`src/api`)는 서버 API만 호출합니다. 이 디렉터리는 레거시 PoC/개발 참고용으로 남아 있으며, 프로덕션 웹 export와 앱 API runtime에 포함되면 안 됩니다. `npm run check:server-web-export`는 `src/api`가 이 디렉터리나 `src/mocks`를 import하면 실패합니다.

## 구조

- `index.ts`: 레거시 PoC용 `mockServer` 진입점
- `types.ts`: mock endpoint id, request params, 반환 계약
- `delay.ts`: 공통 지연/실패 시뮬레이션
- `homeHandlers.ts`: 홈 추천, 무드 추천, Music Log
- `playlistHandlers.ts`: 플레이리스트 상세
- `recapHandlers.ts`: Recap 리스트, Recap 공유
- `tourHandlers.ts`: TourAPI 실패 또는 미설정 시 주변 관광지 fallback
- `authHandlers.ts`: 로그인, 토큰 갱신, 로그아웃, 로컬 데이터 이관 mock

## 레거시 실패 상태 테스트

```bash
EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS=playlist.detail npm run web
```

여러 endpoint는 쉼표로 연결합니다.

```bash
EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS=home.featuredPlaylists,recap.share npm run web
```

전체 실패는 `*`를 사용합니다.

```bash
EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS=* npm run web
```

## 레거시 로딩 상태 테스트

```bash
EXPO_PUBLIC_MOCK_API_DELAY_MS=1500 npm run web
```

## Endpoint ID

- `home.featuredPlaylists`
- `home.moodRecommendations`
- `home.recentMusicLogs`
- `auth.login`
- `auth.register`
- `auth.refresh`
- `auth.logout`
- `auth.me`
- `auth.migrateLocalData`
- `playlist.detail`
- `recap.list`
- `recap.share`
- `tour.nearbyPlaces`

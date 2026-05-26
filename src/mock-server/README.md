# Soundlog Mock Server

실제 서버가 아직 없는 기능을 PoC로 테스트하기 위한 앱 내부 mock server입니다.

## 구조

- `index.ts`: 앱 API 레이어가 가져다 쓰는 `mockServer` 진입점
- `types.ts`: mock endpoint id, request params, 반환 계약
- `delay.ts`: 공통 지연/실패 시뮬레이션
- `homeHandlers.ts`: 홈 추천, 무드 추천, Music Log
- `playlistHandlers.ts`: 플레이리스트 상세
- `recapHandlers.ts`: Recap 리스트, Recap 공유
- `tourHandlers.ts`: TourAPI 실패 또는 미설정 시 주변 관광지 fallback

## 실패 상태 테스트

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

## 로딩 상태 테스트

```bash
EXPO_PUBLIC_MOCK_API_DELAY_MS=1500 npm run web
```

## Endpoint ID

- `home.featuredPlaylists`
- `home.moodRecommendations`
- `home.recentMusicLogs`
- `playlist.detail`
- `recap.list`
- `recap.share`
- `tour.nearbyPlaces`

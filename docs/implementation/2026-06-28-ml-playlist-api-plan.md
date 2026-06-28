# 2026-06-28 ML 플레이리스트 생성 API 연동 계획

## 목표
- 클라이언트가 위치, 여행 상태, 무드를 기반으로 SoundLog 서버의 플레이리스트 생성 API를 호출한다.
- SoundLog 서버는 ML 서버 `POST http://211.188.54.204:8000/recommend`를 호출하고, 응답의 `tracks`를 기존 `PlaylistCuration` DTO로 변환해 클라이언트에 내려준다.
- ML 서버 실패/응답 이상 시 기존 DB/mock fallback이 동작해 앱 흐름이 끊기지 않게 한다.

## 계약
- ML 요청: `{ x: lng, y: lat, state: '바다'|'드라이브'|'산책'|'카페'|'야경', mood: '잔잔한'|'신나는'|'시원한'|'설레는'|'감성적인' }`
- SoundLog 서버 요청: 기존 `POST /v1/playlists/contextual` 유지. body에 `location`, `travelMode`, `mood`를 받는다.
- SoundLog 서버 응답: 기존 `PlaylistCuration` 형태 유지.

## 서버 변경
- `src/config/env.ts`: `ML_RECOMMENDATION_API_URL` env 추가, 기본값은 제공 IP endpoint.
- `src/validators/api.validators.ts`: contextual body에 `mood` 추가, travelMode는 기존 앱 enum을 받되 ML 5개 상태로 매핑한다.
- `src/services/soundlog.service.ts`: ML 호출 helper, state/mood 매핑, 응답 normalize, fallback playlist 생성 추가.
- `src/services/mock-soundlog.service.ts`: mock contextual 입력에도 `mood`/`travelMode` 보존.
- `.env.example`, README/API 테스트 업데이트.

## 클라이언트 변경
- `src/api/playlistApi.ts`: `createContextualPlaylist` 추가. 서버 source + API URL + 로그인 세션이 있을 때 `POST /v1/playlists/contextual` 호출, 실패 시 기존 fallback 상세 조회.
- `src/api/playlistQueries.ts`: contextual mutation 또는 helper hook 추가.
- `app/(tabs)/index.tsx`: featured playlist 카드 선택 시 현재 위치/여행 상태/무드를 body로 서버 API 호출 후 상세 화면으로 이동.
- `src/components/home/FeaturedPlaylistSection.tsx`/`FeaturedPlaylistCard.tsx`: 카드 press handler를 주입할 수 있게 변경.
- `src/components/home/MoodRecommendationSection.tsx`, `src/components/dev/DevTestManager.tsx`: 무드 선택지를 ML 서버 5개로 맞춘다.

## 검증
- ML 서버 샘플 curl 응답 확인.
- 서버 `npm run typecheck`, `USE_MOCK_DB=true npm run test:api`.
- 프론트 `npm run typecheck`.
- 필요 시 실제 서버 API curl로 `POST /v1/playlists/contextual` 확인.

## 리스크와 처리
- ML 서버가 트랙 title/artist만 반환하므로 실제 스트리밍 id는 없다. 클라이언트의 기존 Spotify search fallback을 활용하도록 platform search URL을 생성한다.
- 게스트/미로그인 사용자는 기존 GET `/v1/playlists/:id` fallback으로 이동한다.
- 기존 앱 travelMode `festival`은 ML 서버 상태에 없으므로 `야경` 또는 기본 `산책`으로 fallback한다.

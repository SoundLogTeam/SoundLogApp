# 2026-06-25 Spotify 재생 연동 계획

## 목표

- 초기 기획의 “연동된 음악 플랫폼에서 바로 재생하고 MiniPlayer로 제어한다” 흐름을 Spotify 기준으로 구현한다.
- Soundlog가 Spotify 음원을 직접 스트리밍하지 않고, 사용자의 Spotify 계정/앱/활성 기기에 Web API 명령을 보내는 방식으로 정책 리스크를 낮춘다.
- Spotify 제어가 실패하는 상황에서는 기존 Spotify 앱 딥링크/웹 fallback으로 끊기지 않게 한다.

## 제품 계약

- 사용자는 마이페이지에서 Spotify를 선택하고 계정을 연결할 수 있다.
- Spotify가 연결된 상태에서 추천곡을 누르면 Soundlog 내부 플레이어 상태를 갱신한 뒤 Spotify Web API로 해당 트랙 재생을 시도한다.
- 정확한 Spotify track URI가 없으면 Spotify Search API로 첫 번째 매칭 곡을 찾아 재생한다.
- Premium이 아니거나 활성 Spotify 기기가 없거나 API가 실패하면 Spotify 앱/웹으로 해당 곡을 연다.
- MiniPlayer의 재생/일시정지/다음/이전은 Spotify 연결 상태에서는 Spotify API를 우선 호출하고, 실패하면 앱 내부 큐 상태와 안내 메시지로 fallback한다.

## 정책/제약

- Spotify 공식 문서 기준 Web API 재생 제어는 Premium 사용자/활성 기기 조건이 있다.
- Spotify Web Playback SDK 또는 Soundlog 내부 스트리밍은 이번 범위에서 제외한다.
- Spotify iOS App Remote SDK 네이티브 래핑은 Expo 관리 구조에서는 별도 native module/config plugin 작업이 필요하므로 이번 범위에서 제외한다.
- 실제 동작 확인에는 `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`와 Spotify Dashboard redirect URI 등록이 필요하다.

## 구현 계획

1. 의존성 및 설정
   - `expo-auth-session`, `expo-web-browser`를 추가한다.
   - `app.config.js`에 `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`를 extra로 노출한다.
   - redirect URI는 `soundlog://spotify-auth`를 기본값으로 사용한다.

2. Spotify 인증/토큰 상태
   - `src/store/spotifyAuthStore.ts`를 추가한다.
   - access token, refresh token, expiresAt, connectedAt을 SecureStore 기반 persist로 보관한다.
   - `src/spotify/spotifyAuth.ts`에서 PKCE 로그인, refresh, logout helper를 제공한다.

3. Spotify Web API
   - `src/spotify/spotifyPlayback.ts`를 추가한다.
   - 현재 access token 보장, search로 track URI resolve, play/pause/next/previous API 호출을 담당한다.
   - 실패 코드를 `not_configured`, `not_connected`, `premium_required`, `no_active_device`, `not_found`, `network_error` 등으로 정규화한다.

4. UI/상태 연결
   - 마이페이지 음악 플랫폼 카드에 Spotify 연결/해제 버튼과 연결 상태를 추가한다.
   - Playlist row/대표 재생 버튼에서 Spotify 연결 상태면 실제 재생을 먼저 시도하고, 실패하면 딥링크 fallback을 연다.
   - MiniPlayer 제어 버튼에서 Spotify API를 우선 호출하고 사용자에게 실패 이유를 짧게 보여준다.

5. 검증
   - `npm run typecheck`
   - `npm run doctor`
   - store release check
   - Expo export
   - 서버 API 테스트는 이번 변경이 프론트 OAuth/Web API 중심이라 회귀 확인용으로 실행한다.

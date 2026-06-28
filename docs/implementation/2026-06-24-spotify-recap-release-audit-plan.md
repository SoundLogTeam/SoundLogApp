# 2026-06-24 Spotify/Recap 배포 직전 보강 계획

## 목표

- 현재 앱의 음악 재생/Spotify 연결이 실제 동작과 다르게 과장되지 않도록 정리한다.
- Spotify는 네이티브 앱 딥링크를 우선 시도하고 실패하면 웹 링크로 fallback한다.
- 마지막 Music Recap 공유 화면에서 대표곡, 순간 수, 장소 흐름, 수록곡 정보를 사용자가 바로 검수할 수 있게 만든다.
- 서버 Recap 생성은 명시 대표곡 또는 저장된 Moment의 음악 정보를 안정적으로 선택하고, 공유 DTO에 충분한 moments 데이터를 유지한다.

## 확인한 사실

- 현재 MiniPlayer의 재생/이전/다음 버튼은 Soundlog 내부 큐 상태만 조작한다.
- 현재 Spotify 링크는 `https://open.spotify.com/search/...` 웹 검색 링크 중심이다.
- Spotify 공식 문서 기준으로 실제 원격 재생/스트리밍 제어는 OAuth scope, Premium, Spotify 앱/SDK, 정책 검토가 필요하다. 이번 배포 직전 범위에서는 외부 앱/웹 연결까지를 안전한 MVP로 둔다.
- Recap 서버 응답은 `moments` 배열을 내려주지만, 공유 화면은 카드와 날짜만 보여줘 Music Recap 검수 정보가 부족하다.

## 구현 계획

1. Spotify 링크 처리 강화
   - `TrackExternalLinkResult`에 fallback URL과 open target 정보를 추가한다.
   - Spotify track/album/playlist/artist URL은 `spotify:{type}:{id}` 딥링크로 변환한다.
   - Spotify 검색 fallback은 `spotify:search:{query}`를 먼저 열고, 실패하면 `https://open.spotify.com/search/{query}`를 연다.
   - iOS `LSApplicationQueriesSchemes`에 `spotify`를 추가한다.
   - 외부 음악 열기 이벤트를 추천 이벤트로 기록할 수 있게 타입/서버 validator를 확장한다.

2. Music Recap 상세 검수 UI 추가
   - `RecapMusicSummary` 컴포넌트를 추가한다.
   - 표시 항목: 대표 음악, 저장된 순간 수, 방문 장소 수, 수록곡 수, 시작/마지막 장소 흐름.
   - 로컬 Recap과 서버 Recap 모두 `moments` 기반으로 동일하게 계산한다.
   - 기존 공유 카드 캡처 영역에는 영향을 주지 않고, 카드 아래 검수 정보로만 배치한다.

3. 서버 Recap 생성 보강
   - Moment 조회 결과를 시간순으로 정렬하고, 명시 대표곡이 없으면 음악이 있는 최신 Moment를 대표곡으로 선택한다.
   - 대표 이미지/기록 시각은 첫 Moment 기준으로 유지해 여행 시작 맥락을 보존한다.
   - mock 서버도 동일한 대표곡 선택 규칙을 맞춘다.

4. 검증
   - Frontend: `npm run typecheck`, store release check, Expo export.
   - Server: `npm run typecheck`, `USE_MOCK_DB=true npm run test:api`, `npm run build`, production env check.
   - 결과에서 실제 배포 전 남은 키/도메인/정책 블로커를 별도 정리한다.

## 이번 범위에서 하지 않는 것

- Spotify SDK 기반 인앱 원격 재생 제어.
- Spotify Web Playback SDK 스트리밍.
- Instagram/Snapchat 전용 네이티브 공유 SDK 연동.
- 서버 이미지 렌더링 기반 Recap 생성.

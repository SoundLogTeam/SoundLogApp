# Soundlog 음악 큐레이션 페이지 구현 계획

## 1. 작업 목표

현재 placeholder 수준의 `playlist/[id]` 화면을 Figma 음악 큐레이션 화면과 제작 문서 기준에 맞춰 실제 MVP 상세 화면으로 개선한다. 이번 작업은 실제 음악 플랫폼 SDK, 실제 관광공사 API, 실제 오디오 재생 엔진을 붙이는 단계가 아니라, 추천 결과 상세 화면의 RN 구조와 mock 데이터 흐름을 안정적으로 만드는 단계이다.

## 2. 사용자 목표

사용자는 홈의 대표 플레이리스트 카드를 눌러 상세 화면으로 진입한 뒤, 장소 기반 추천 이유를 확인하고, 곡 목록을 탐색하며, 원하는 곡을 눌러 미니 플레이어에 즉시 반영할 수 있어야 한다. 하단 탭바와 중앙 카메라 진입점은 홈과 동일하게 유지되어야 한다.

## 3. 범위

### 포함

- 큐레이션 상세 화면 라우팅을 탭 그룹 내부로 이동해 하단 탭바 유지
- 플레이리스트 상세 query hook 추가
- 플레이리스트 상세 타입 확장
- 장소 이미지 배경 + dark overlay
- 고정형 glass 스타일 바텀시트
- 추천 지역/추천 사유/대표 재생 버튼
- 트랙 리스트 `FlatList`
- 트랙 row 탭 시 `usePlayerStore.setTrack(track, playlistId)` 연결
- 현재 재생 중인 row 시각적 하이라이트
- 더보기 메뉴의 MVP 로컬 액션 UI
- 로딩/에러/빈 상태
- MiniPlayer와 탭바가 TrackList를 가리지 않도록 하단 패딩 정리

### 제외

- 실제 음악 스트리밍 SDK 재생
- 실제 외부 음악 앱 deep link 오픈
- 실제 좋아요/저장 서버 mutation
- 드래그 가능한 BottomSheet
- blur 라이브러리 추가
- 위치 권한 요청 및 위치 기반 playlist 생성
- 카메라 저장 플로우 구현

## 4. 현재 상태

현재 [app/playlist/[id].tsx](/Users/manwook-han/Desktop/hmw/code/soundlog/app/playlist/[id].tsx)는 다음 상태다.

- 플레이리스트 상세 UI가 한 파일에 작성되어 있음
- `playlistDetail` mock을 직접 import함
- route id만 반영하고 query 상태는 없음
- 루트 `Stack` 화면이므로 하단 탭바가 유지되지 않음
- `MiniPlayer`는 탭바 높이를 기준으로 올라오지만 실제 화면에는 탭바가 없어 하단 여백이 어색해질 수 있음

## 5. 구현 방향

큐레이션 화면도 메인페이지처럼 route 파일은 얇게 유지하고, UI는 `src/components/playlist`로 분리한다.

```txt
app/(tabs)/playlist/[id].tsx
  PlaylistCurationScreen

src/components/playlist/
  PlaylistBackground.tsx
  PlaylistBottomSheet.tsx
  PlaylistHeroInfo.tsx
  TrackList.tsx
  TrackRow.tsx
  TrackActionMenu.tsx
  PlaylistState.tsx

src/api/playlistApi.ts
src/api/playlistQueries.ts
src/mocks/playlistMocks.ts
src/types/domain.ts
```

기존 `app/playlist/[id].tsx`는 삭제하고, `app/(tabs)/_layout.tsx`에 `playlist/[id]`를 숨김 tab route로 등록한다.

## 6. 라우팅 설계

홈 카드의 기존 이동 경로는 그대로 유지한다.

```ts
router.push(`/playlist/${playlist.id}`)
```

Expo Router에서 route group은 URL path에 포함되지 않으므로 `app/(tabs)/playlist/[id].tsx`는 동일하게 `/playlist/:id`로 접근된다. 대신 화면이 탭 그룹 내부에서 렌더링되어 하단 탭바가 유지된다.

`app/_layout.tsx`에서는 루트 스택의 `playlist/[id]` 등록을 제거한다. 현재 앱에는 외부 딥링크/푸시 알림/공유 링크에서 playlist 상세로 직접 진입하는 구현이 없으며, Expo Router의 route group은 URL path를 바꾸지 않으므로 앱 내부 URL은 `/playlist/:id`로 유지된다.

`app/(tabs)/_layout.tsx`는 이미 `headerShown: false`를 적용하고 있으므로 큐레이션 화면에서도 native header가 노출되지 않는다. `playlist/[id]`는 `href: null` 옵션으로 탭바 버튼에는 노출하지 않는다.

## 7. 데이터 계약

### 타입 확장

```ts
type Track = {
  id: string;
  title: string;
  artist: string;
  fallbackColor?: string;
  albumImageUrl?: string;
  previewUrl?: string;
  externalUrl?: string;
  isLiked?: boolean;
  isSaved?: boolean;
};

type PlaylistCuration = {
  id: string;
  regionName: string;
  placeName?: string;
  reason: string;
  coverImageUrl?: string;
  backgroundImageUrl?: string;
  trackCount: number;
  durationText: string;
  tracks: Track[];
};
```

### Query hook

```ts
usePlaylistCurationQuery(id?: string)
```

현재는 `playlistApi.getPlaylist(id)`가 mock을 반환한다. 후속 실제 API 전환 시 다음 계약으로 옮길 수 있게 이름을 상세하게 둔다.

```txt
GET /v1/playlists/:playlistId
```

## 8. 상태 소유권

| 상태 | 위치 | 설명 |
| --- | --- | --- |
| 현재 곡 | `usePlayerStore` | 트랙 row 또는 대표 재생 버튼 클릭 시 설정 |
| 상세 데이터 | TanStack Query | mock API 기반 로딩/에러/캐시 |
| 더보기 메뉴 열림 | 화면 로컬 state | 선택 track id와 함께 관리 |
| 좋아요/저장 UI | 화면 로컬 state | 서버 mutation 전까지 MVP 로컬 상태 |

좋아요/저장은 이번 단계에서 서버 동작이 아니므로 재진입 시 유지하지 않는다. 실제 사용자 데이터 정책과 서버 API가 확정되면 별도 mutation 및 optimistic rollback으로 확장한다.

현재 `usePlayerStore.setTrack(track, playlistId?)` 시그니처는 이미 두 번째 인자로 `playlistId`를 지원한다. 따라서 큐레이션 화면은 트랙 선택 시 playlist context를 player store에 함께 넘긴다.

## 9. UI 상세 계획

### 9.1 PlaylistBackground

- `expo-image`의 `Image` 사용
- `backgroundImageUrl`이 있으면 full-screen cover
- 이미지가 없으면 기존 Soundlog dark gradient fallback
- 항상 검은 overlay를 얹어 텍스트 대비 확보

### 9.2 PlaylistBottomSheet

- 화면 상단 약 190~210px 지점에서 시작
- 상단 좌우 radius 20
- `bg-black/70` 또는 `rgba(5, 9, 22, 0.78)` 수준의 반투명 배경
- drag 기능은 제외하고 grabber만 표시
- 프로젝트에 bottom sheet 전용 의존성이 없으므로 `@gorhom/bottom-sheet`는 추가하지 않는다.
- Figma glass 느낌은 MVP에서 solid rgba overlay로 대체한다. `expo-blur`는 Android 성능/일관성 검증 후 후속 과제로 둔다.

### 9.3 PlaylistHeroInfo

- 지역명 또는 장소명
- 추천 사유
- `trackCount`, `durationText` 메타
- 대표 play 버튼
- play 버튼 클릭 시 첫 번째 트랙을 현재 곡으로 설정
- 트랙이 없으면 play 버튼 disabled

### 9.4 TrackList / TrackRow

- `FlatList` 사용
- Android 내부 스크롤 안정성을 위해 `nestedScrollEnabled`를 지정한다.
- row height 66px
- 앨범 이미지가 있으면 이미지, 없으면 fallback color block
- 제목 한 줄 말줄임
- 아티스트 한 줄 말줄임
- 현재 재생 중인 곡은 좌측 thumb ring 또는 row background로 표시
- `onPress` 시 player store 업데이트
- 더보기 버튼은 row press와 충돌하지 않도록 별도 `Pressable`
- `contentContainerStyle.paddingBottom`은 `getCurationListBottomPadding(safeAreaBottom, hasMiniPlayer)`로 계산한다.
- 이 함수는 기존 `layout.tabBarBaseHeight`, `layout.miniPlayerHeight`, `layout.miniPlayerGap`을 재사용해 기기별 safe-area bottom을 반영한다.

### 9.5 TrackActionMenu

MVP에서는 React Native `Modal` 기반 하단 액션 메뉴로 구현한다.

항목:

- 좋아요
- 저장하기
- 외부 음악 앱에서 열기

`외부 음악 앱에서 열기`는 `externalUrl`이 있는 곡에서만 노출한다. 현재 mock 데이터는 `externalUrl`을 제공하지 않으므로 MVP 화면에는 좋아요/저장하기만 노출한다. 음악 플랫폼 필수 여부는 아직 확정하지 않고, 이번 구현에서는 외부 앱 연동을 요구하지 않는다.

`Track.isLiked`, `Track.isSaved` 초기값이 mock에서 제공되면 화면 로컬 state 초기값으로 사용한다. 메뉴 액션은 화면 내 UI만 갱신하고 서버 영속화는 하지 않는다.

## 10. 예외 상태

| 상황 | 처리 |
| --- | --- |
| playlist id 없음 | fallback id 또는 에러 상태 |
| 상세 로딩 | 배경/시트/트랙 skeleton |
| 상세 실패 | 재시도 가능한 에러 화면 |
| playlist 없음 | “이 위치에 맞는 음악을 찾는 중이에요” fallback |
| tracks 없음 | “아직 추천 곡을 준비 중이에요” fallback |
| 이미지 없음 | dark gradient fallback |
| 첫 곡 재생 시 tracks 없음 | play button disabled |
| 작은 화면 | sheet 내부 리스트 스크롤, 하단 padding 확보 |
| MiniPlayer 노출 | TrackList padding bottom에 tabBar + MiniPlayer 높이 반영 |

## 11. 구현 순서

1. `PlaylistCuration` 타입 추가 및 mock 데이터 확장
2. `playlistApi` 응답 타입 정리
3. `playlistQueries.ts` 추가
4. route를 `app/(tabs)/playlist/[id].tsx`로 이동
5. `app/_layout.tsx`, `app/(tabs)/_layout.tsx` 라우팅 보정
6. `src/components/playlist` 컴포넌트 작성
7. 트랙 탭/대표 재생 버튼을 player store에 연결
8. 더보기 메뉴 로컬 UI 연결
9. 타입체크, Expo Doctor, iOS/web export 스모크 테스트
10. 개발 서버에서 route 응답 확인

## 12. Claude 리뷰 반영 사항

Claude 리뷰에서 지적된 블로킹 항목은 다음처럼 반영한다.

- `setTrack(track, playlistId?)`는 현재 store에서 이미 지원함을 확인했다.
- 하단 padding은 기존 layout 상수를 공유하는 `getCurationListBottomPadding`로 처리한다.
- playlist route는 탭 그룹 내부로 이동하되 URL은 `/playlist/:id`로 유지한다. 현재 외부 딥링크 진입점은 없다.
- 탭 그룹은 이미 `headerShown: false`이므로 별도 native header가 노출되지 않는다.
- skeleton은 추가 라이브러리 없이 단순 `View` placeholder로 처리한다.
- 상세 query는 `staleTime: 5 * 60 * 1000`을 지정한다.
- UI 검증 체크리스트에 탭바 유지, 트랙 탭 후 MiniPlayer 갱신, 마지막 트랙 가림 여부를 포함한다.

## 13. Claude 리뷰 전 확인한 엣지케이스

현재 사용자에게 물어야 할 블로킹 엣지케이스는 없다. 실제 음악 플랫폼 연동, 좋아요/저장 영속화, 카메라 로그 저장 정책은 이번 범위에서 제외하고 mock/local UI로만 처리한다. 이 결정은 제품 정책을 확정하는 것이 아니라 MVP UI 구조를 준비하는 임시 구현이다.

## 14. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

검증 후 `.expo-export-smoke`, `.expo-export-smoke-web`는 삭제한다.

수동 확인 항목:

- `/playlist/seoul-night` route가 탭바를 유지하는지 확인
- 대표 play 버튼 클릭 시 첫 곡이 MiniPlayer에 표시되는지 확인
- 트랙 row 클릭 시 현재 곡이 바뀌고 row 하이라이트가 바뀌는지 확인
- 마지막 트랙이 MiniPlayer와 탭바 뒤에 가려지지 않는지 확인
- 더보기 메뉴가 row press와 충돌하지 않는지 확인

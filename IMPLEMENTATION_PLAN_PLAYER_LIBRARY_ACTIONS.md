# Soundlog 보관함/미니플레이어 음악 액션 고도화 구현 계획

## 1. 작업 목표

직전 단계에서 마이페이지 음악 플랫폼 선택과 플레이리스트 상세의 외부 음악 앱 열기 UX를 구현했다. 다음 단계에서는 이 기능이 플레이리스트 상세에만 머물지 않도록, **보관함과 미니플레이어에서도 같은 트랙 액션을 사용할 수 있게 확장**한다.

현재 사용자는 Library 탭에서 저장한 곡을 볼 수 있고 미니플레이어에서 현재 곡을 확인할 수 있지만, 저장한 곡이나 현재 재생 중인 곡을 선택 플랫폼으로 바로 열 수 없다. 또한 미니플레이어의 이전/다음 아이콘은 실제 queue가 없는 상태에서 시각 요소로만 남아 있어, MVP 관점에서는 명확한 액션으로 정리할 필요가 있다.

## 2. 사용자 목표

- 사용자는 보관함에 저장된 곡을 다시 확인한 뒤 선택한 음악 플랫폼에서 바로 검색하거나 열 수 있다.
- 사용자는 미니플레이어의 현재 곡을 별도 화면 이동 없이 외부 음악 플랫폼에서 이어 들을 수 있다.
- 좋아요/저장 취소는 기존처럼 즉시 반영되며, 추천 피드백 이벤트도 유지된다.
- 링크가 없어도 `artist + title` 기반 검색 fallback으로 재생 흐름을 막지 않는다.

## 3. 범위

### 포함

- `TrackActionMenu`를 플레이리스트 상세 외부에서도 재사용
- Library 탭 각 곡 row의 우측 액션을 `곡 옵션 열기`로 변경
- Library 탭에서 좋아요/저장 토글, 외부 플랫폼 열기 지원
- MiniPlayer에서 현재 곡 옵션 메뉴 열기 지원
- MiniPlayer의 실제 동작 없는 skip-back/skip-forward 아이콘 제거 또는 비활성 UI 정리
- 보관함/미니플레이어 액션에서 추천 피드백 이벤트 기록 유지
- 외부 링크 열기 실패/URL 생성 불가 메시지는 기존 `TrackActionMenu` 정책 재사용

### 제외

- 실제 음악 queue 구현
- 이전 곡/다음 곡 이동 기능
- 백그라운드 오디오 재생
- Spotify/Melon OAuth 또는 SDK 재생
- 외부 플랫폼 열기 이벤트의 분석 로그 저장
- 서버 동기화
- undo toast

## 4. 기능 계약

### Entry Point

- `Library 탭 > 좋아요/저장한 곡 row > 옵션 버튼`
- `MiniPlayer > 현재 곡 옵션 버튼`
- 기존 `Playlist 상세 > 트랙 더보기`는 유지

### Exit Point

- 외부 링크 열기 성공 시 메뉴가 닫힌다.
- 좋아요/저장 토글 시 메뉴는 유지하고, row 및 미니플레이어 상태가 즉시 갱신된다.
- 보관함에서 현재 탭에 해당하는 상태를 취소하면 해당 row는 리스트에서 제거된다.
- URL 생성 불가 또는 `Linking.openURL` reject 시 메뉴 안에서 오류 메시지를 보여준다.

## 5. 컴포넌트 설계

### `TrackActionMenu`

현재 구조는 `track`, `isLiked`, `isSaved`, `onToggleLike`, `onToggleSave`를 props로 받기 때문에 재사용 가능하다. 이번 단계에서는 큰 구조 변경 없이 Library와 MiniPlayer에서 같은 컴포넌트를 사용한다.

필요한 보완:

- 메뉴가 `playlistId`를 직접 알 필요는 없도록 유지한다.
- 외부 열기 라벨과 fallback 로직은 기존 `musicPlatformLinks` 유틸을 그대로 사용한다.
- 메뉴 닫힘 중 오류 상태 초기화 정책 유지
- 메뉴 헤더에서 `track.albumImageUrl`이 있으면 이미지를 표시하고, 없을 때만 `fallbackColor` 블록을 사용한다.

### `LibraryScreen`

현재:

- row press: `setTrack(record.track, record.playlistId)`
- 우측 버튼: 현재 탭 기준 좋아요/저장 즉시 제거

변경:

- row press는 그대로 현재 곡으로 설정한다.
- 우측 버튼은 `more-horizontal` 아이콘으로 고정하고 `TrackActionMenu`를 연다.
- 선택된 record를 `selectedRecord` 상태로 보관한다.
- `selectedRecord`는 메뉴 오픈 시점의 스냅샷으로 보관하되, `isLiked`/`isSaved` 값은 store selector로 동적으로 계산한다.
- 메뉴의 좋아요/저장 액션은 `libraryStore`의 `toggleLike`, `toggleSave` 사용
- 액션 후 추천 이벤트 기록
- 현재 선택 탭의 row가 좋아요/저장 취소로 제거되는 액션을 수행하면 메뉴를 닫는다.
- Library 탭을 전환하면 열린 메뉴를 닫아 이전 탭 record가 남지 않게 한다.

이유:

- 보관함에서는 단순 삭제보다 `열기`, `좋아요/저장 전환`, `외부 플랫폼 이동`이 함께 필요하다.
- row 자체는 빠른 재생 역할을 유지해 사용자의 기존 흐름을 깨지 않는다.

### `LibraryTrackRow`

변경 props:

```ts
type LibraryTrackRowProps = {
  onOpenActions: () => void;
  onPress: () => void;
  record: LibraryTrackRecord;
};
```

기존 `onRemove`, `actionIcon`, `actionLabel`은 제거하고, 액션 버튼은 메뉴 오픈 전용으로 바꾼다.

### `MiniPlayer`

현재:

- 좋아요 버튼
- 이전/재생/다음 아이콘
- 이전/다음은 실제 동작이 없다.

변경:

- 현재 곡 옵션 버튼을 추가해 `TrackActionMenu`를 연다.
- 좋아요 버튼과 재생/일시정지 버튼은 유지한다.
- 실제 queue 구현 전까지 이전/다음 아이콘은 제거한다.
- 메뉴에서 저장하기/저장 취소, 외부 플랫폼 열기를 지원한다.
- 메뉴의 저장 토글은 `playerStore.playlistId`를 함께 전달해 보관함 record의 출처를 유지한다.

권장 배치:

- 하트
- 재생/일시정지
- 더보기

## 6. 상태 및 이벤트 설계

### 상태

- `LibraryScreen`
  - `selectedRecord?: LibraryTrackRecord`
- `MiniPlayer`
  - `isActionMenuVisible`

### 추천 이벤트

기존 이벤트 정책을 유지한다.

| 액션 | 이벤트 |
| --- | --- |
| Library row press | `track_play` |
| Library menu 좋아요 | `track_like` / `track_unlike` |
| Library menu 저장 | `track_save` / `track_unsave` |
| MiniPlayer 좋아요 | `track_like` / `track_unlike` |
| MiniPlayer menu 저장 | `track_save` / `track_unsave` |
| MiniPlayer 재생/일시정지 | `track_resume` / `track_pause` |
| 외부 플랫폼 열기 | 기록하지 않음 |

외부 플랫폼 열기는 추천 품질 신호가 아니라 UX 연동 신호이므로, 직전 계획과 동일하게 recommendation event에 남기지 않는다.

## 7. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 보관함 row가 메뉴 열린 상태에서 리스트에서 제거됨 | `selectedRecord`를 기준으로 메뉴를 닫고, 리스트는 store 상태를 따른다. |
| persisted old track에 `platformUrls` 없음 | `artist + title` 검색 fallback 사용 |
| track title이 빈 문자열 | fallback URL을 만들 수 없으므로 외부 열기 액션 비활성 및 기존 오류 메시지 사용 |
| playlistId가 없는 보관함 record | 이벤트는 기록하되 playlistId 생략 |
| currentTrack 없음 | MiniPlayer 자체를 렌더링하지 않음 |
| currentTrack이 보관함에 없는 곡 | 메뉴에서 좋아요/저장 가능 |
| 외부 링크 open 중 사용자가 메뉴를 닫음 | 기존 `TrackActionMenu`의 열기 중 닫힘 방지 정책 유지 |
| Web 환경 | HTTPS 검색/플랫폼 URL을 열고, reject 시 오류 메시지 표시 |
| Library 탭 전환 중 메뉴 열림 | 메뉴 자동 닫힘 |
| 현재 탭의 row가 토글로 제거됨 | 메뉴 자동 닫힘 |

## 8. 구현 파일 계획

수정 파일:

```txt
src/components/MiniPlayer.tsx
src/components/library/LibraryScreen.tsx
src/components/library/LibraryTrackRow.tsx
src/components/playlist/TrackActionMenu.tsx
```

필요 시 수정:

```txt
src/types/domain.ts
```

이번 단계에서는 신규 store를 만들지 않는다.

## 9. 구현 순서

1. `LibraryTrackRow`의 우측 액션을 제거/삭제 전용에서 옵션 메뉴 오픈 전용으로 변경
2. `LibraryScreen`에 `TrackActionMenu` 연결
3. Library 메뉴 토글 액션에 `libraryStore`와 추천 이벤트 연결
4. `MiniPlayer`에서 미동작 skip 아이콘 제거 및 더보기 액션 추가
5. `MiniPlayer`에 `TrackActionMenu` 연결
6. `TrackActionMenu` 헤더에 앨범 이미지 fallback 표시 개선
7. 타입체크, Expo Doctor, Android/iOS/Web export 검증

## 10. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform android --output-dir .expo-export-smoke-android
npx expo export --platform ios --output-dir .expo-export-smoke-ios
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- Library 좋아요 탭에서 row 터치 시 미니플레이어 곡 변경
- Library row 옵션에서 외부 플랫폼 열기 동작
- Library row 옵션에서 좋아요 취소 시 좋아요 탭에서 제거
- Library 저장 탭에서 저장 취소 시 저장 탭에서 제거
- MiniPlayer 더보기에서 외부 플랫폼 열기 동작
- MiniPlayer 더보기에서 저장 토글 후 Library 반영
- 미동작 이전/다음 아이콘이 더 이상 조작 가능한 것처럼 보이지 않는지 확인

## 11. 리스크 및 후속 과제

- 외부 플랫폼 열기는 HTTPS fallback 중심이므로, 실제 앱 설치 여부 기반 딥링크 최적화는 후속 과제다.
- 이전/다음 곡 이동은 queue 모델이 필요하므로 별도 계획에서 다룬다.
- Library row에서 옵션 버튼으로 바뀌면서 즉시 삭제 UX는 한 단계 늘어난다. 대신 실수 삭제를 줄이고 외부 재생 진입점을 확보한다.
- 좋아요/저장 취소로 현재 탭 row가 제거되는 경우 메뉴를 자동으로 닫아 화면과 메뉴 상태가 어긋나지 않게 한다.

## 12. Claude 리뷰 기록

Claude 직접 리뷰 완료. 기본 판단은 **Go**이며, 구현 중 반영할 주요 피드백은 다음과 같다.

- `LibraryTrackRow`와 `LibraryScreen` props 변경은 함께 처리해 타입 깨짐을 방지한다.
- `TrackActionMenu`를 Library에서 재사용할 때 앨범 이미지 표시가 row와 어긋나지 않도록 `albumImageUrl`을 반영한다.
- MiniPlayer의 실제 동작 없는 이전/다음 아이콘은 제거하는 방향이 맞다.
- Library 메뉴의 `selectedRecord`는 오픈 시점 스냅샷으로 두되, 좋아요/저장 여부는 store에서 동적으로 계산한다.
- Library 탭 전환 또는 현재 탭 row 제거 시 메뉴를 자동으로 닫는다.

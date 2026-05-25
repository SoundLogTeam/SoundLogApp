# Soundlog 보관함/좋아요 Phase 1 구현 계획

## 1. 작업 목표

플레이리스트 상세 화면에서 좋아요/저장한 곡을 로컬 보관함에 저장하고, `Library` 탭에서 다시 확인할 수 있도록 구현한다. 현재 좋아요/저장 상태는 화면 내부 `Set`에만 존재하므로 화면을 벗어나면 사라진다. 이번 단계에서는 Zustand persist 기반 로컬 저장소로 상태를 승격한다.

## 2. 사용자 목표

- 플레이리스트 곡 메뉴에서 `좋아요` 또는 `저장하기`를 누른다.
- 좋아요/저장 상태가 곡 row와 미니 플레이어에 즉시 반영된다.
- Library 탭에서 좋아요한 음악과 저장한 음악을 확인한다.
- 앱을 재시작해도 로컬 보관함 데이터가 유지된다.

## 3. 범위

### 포함

- `libraryStore` 추가
- 좋아요 곡/저장 곡 로컬 persist
- 플레이리스트 mock의 초기 `isLiked`, `isSaved` 값을 1회 seed
- `PlaylistCurationScreen`의 로컬 `Set` 제거 및 store 연결
- `MiniPlayer` 좋아요 버튼 연결
- `Library` 탭 리스트 UI 구현
- 좋아요/저장 빈 상태

### 제외

- 서버 동기화
- 음악 플랫폼 실제 저장 API
- 저장한 플레이리스트 단위 목록
- undo toast
- 좋아요 취소 확인 모달

## 4. 데이터 설계

```ts
type LibraryTrackRecord = {
  track: Track;
  playlistId?: string;
  createdAt: string;
};
```

저장소:

```txt
src/store/libraryStore.ts
```

상태:

- `likedTracks`
- `savedTracks`
- `seededPlaylistIds`

액션:

- `seedFromPlaylist(playlistId, tracks)`
- `toggleLike(track, playlistId?)`
- `toggleSave(track, playlistId?)`
- `isLiked(trackId)`
- `isSaved(trackId)`

## 5. Seed 정책

mock/API에서 내려온 `track.isLiked`, `track.isSaved`는 초기 상태로만 사용한다. 사용자가 좋아요를 취소했는데 화면 재진입 때 mock 값 때문에 다시 살아나면 안 된다.

따라서 `seededPlaylistIds`를 persist하고, 같은 playlist는 한 번만 seed한다.

## 6. 화면 설계

### Library 탭

세그먼트:

- 좋아요
- 저장한 곡

리스트 카드:

- 앨범 컬러/이미지
- 곡 제목
- 아티스트
- 저장 시각
- 좋아요/저장 해제 버튼

빈 상태:

- 좋아요 없음: `마음에 드는 음악에 하트를 눌러보세요.`
- 저장 없음: `다시 듣고 싶은 음악을 저장해보세요.`

## 7. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 같은 곡 중복 저장 | 기존 record를 제거하거나 갱신하고 중복 생성 방지 |
| track metadata 부족 | title/artist는 필수 타입이므로 fallback 불필요 |
| 앱 재시작 | AsyncStorage persist로 유지 |
| mock seed 이후 사용자가 취소 | `seededPlaylistIds`로 재생성 방지 |
| 현재 재생 곡이 좋아요 해제됨 | 미니 플레이어 아이콘 즉시 갱신 |

## 8. 구현 순서

1. `libraryStore.ts` 추가
2. `PlaylistCurationScreen`에서 store seed/toggle 연결
3. `TrackActionMenu`는 기존 인터페이스 유지
4. `MiniPlayer`에 좋아요 버튼 추가
5. `LibraryTrackRow`와 `LibraryScreen` UI 구현
6. 타입체크/Expo Doctor/export 검증

## 9. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- 플레이리스트에서 좋아요/저장 토글
- Library 탭 반영
- 좋아요 취소 시 Library에서 제거
- 미니 플레이어 좋아요 토글 반영

## 10. Claude 리뷰 기록

`claude_review_plan.sh IMPLEMENTATION_PLAN_LIBRARY_LOCAL.md` 실행 결과 Claude 사용량 제한으로 실패했다.

```txt
You've hit your limit · resets 8:10pm (Asia/Seoul)
```

따라서 이번 구현은 자체 체크리스트 기준으로 진행하고, 제한 해제 후 후속 리뷰를 받을 수 있도록 계획 파일을 유지한다.

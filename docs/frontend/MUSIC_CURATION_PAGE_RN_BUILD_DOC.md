# Soundlog 음악 큐레이션 페이지 제작 문서

## 1. 문서 목적

이 문서는 Figma의 `Playlist` 화면 중 음악 큐레이션 페이지를 React Native 기반 Soundlog 앱에서 구현하기 위한 제작 기준서이다.

Figma 기준 화면은 사용자의 현재 위치를 기반으로 추천된 플레이리스트를 보여주는 화면이다. 상단에는 장소 이미지가 크게 깔리고, 하단에는 유리 질감의 바텀시트 형태로 추천 지역, 외부 링크 버튼, 트랙 리스트, 미니 플레이어가 배치된다.

---

## 2. 화면 역할

음악 큐레이션 페이지는 사용자가 홈에서 추천 플레이리스트 또는 무드 추천 카드를 눌렀을 때 진입하는 상세 화면이다.

이 화면의 핵심은 다음과 같다.

1. 현재 위치 또는 선택 장소 기반 플레이리스트를 보여준다.
2. 왜 이 플레이리스트가 추천되었는지 장소 맥락을 전달한다.
3. 곡 리스트를 탐색하고 외부 음악 앱 검색 링크를 바로 열 수 있게 한다.
4. 곡별 더보기, 저장, 좋아요 같은 음악 액션의 진입점을 제공한다.
5. 현재 선택한 음악은 미니 플레이어로 유지한다.

---

## 3. Figma 화면 요약

| 영역 | 내용 |
| --- | --- |
| 배경 이미지 | 서울 야경/도시 이미지가 상단과 하단에 반복 배치 |
| 상단 상태바 | iPhone 상태바 |
| 하단 시트 | `Seoul`, `Based on your location`, 외부 링크 버튼, 곡 리스트 |
| 트랙 리스트 | `Seoul City`, `서울의 달`, `한강에서`, `밤편지`, `홍대와 건대사이` 등 |
| 미니 플레이어 | 현재 선택 곡 `Seoul City / JENNIE` |
| 하단 탭바 | 홈, 위치, 카메라, 좋아요, 마이 |

---

## 4. RN 구현 방향 요약

Figma에서는 바텀시트와 트랙 리스트가 절대 좌표로 배치되어 있지만, RN 구현에서는 다음 구조를 권장한다.

```txt
PlaylistCurationScreen
  ImageBackground / LinearGradient
  SafeAreaHeader
  PlaylistBottomSheet
    SheetGrabber
    PlaylistHeroInfo
    TrackList
  MiniPlayer fixed inside sheet or above tab
  BottomTabBar fixed
```

### 구현 원칙

- 상태바는 직접 그리지 않고 `expo-status-bar` 또는 native status bar를 사용한다.
- 배경 이미지는 `ImageBackground` 또는 `expo-image`를 사용한다.
- 하단 시트는 `BottomSheet` 느낌의 고정 패널로 시작하고, MVP에서는 드래그 확장 기능을 후순위로 둔다.
- 트랙 리스트는 `FlatList`로 구현한다.
- 미니 플레이어는 곡 리스트 위에 떠 있는 형태로 고정한다.
- 하단 탭바와 미니 플레이어가 겹치지 않도록 safe area inset을 반영한다.

---

## 5. 레이아웃 명세

### 5.1 화면 루트

| 속성 | 값 |
| --- | --- |
| 기준 화면 | 390 x 844 |
| 배경 | 장소 대표 이미지 + 어두운 오버레이 |
| 상단 이미지 높이 | 약 260~300px |
| 하단 시트 시작 위치 | 화면 상단에서 약 200px |
| 시트 radius | 상단 좌우 20px |
| 시트 배경 | blur/dim dark glass |

### 5.2 배경 이미지

Figma에서는 서울 이미지가 상단과 시트 뒤쪽에 반복되어 보인다. RN에서는 다음 방식으로 단순화한다.

```txt
ImageBackground full screen
  dark overlay
  BottomSheet with semi-transparent background
```

권장 스타일:

```txt
absolute inset-0
bg-black/40 overlay
```

`expo-blur`를 사용할 수 있다면 시트에는 `BlurView` 적용을 검토한다.

단, Android에서 blur 성능 이슈가 있을 수 있으므로 MVP에서는 반투명 배경으로 시작한다.

---

## 6. 섹션별 제작 명세

## 6.1 PlaylistHeroInfo

### 역할

현재 플레이리스트의 지역/장소 기반 추천 정보를 보여준다.

### 표시 정보

- 지역명: `Seoul`
- 추천 근거: `Based on your location`
- 재생 버튼

### RN 컴포넌트 구조

```txt
PlaylistHeroInfo
  Text regionName
  Text recommendationReason
  PlayButton
```

### 데이터 타입

```ts
type PlaylistCuration = {
  id: string;
  regionName: string;
  placeName?: string;
  reason: string;
  coverImageUrl?: string;
  backgroundImageUrl?: string;
  trackCount: number;
  durationText: string;
  tracks: CuratedTrack[];
};
```

### 카피 정책

Figma의 `Based on your location`은 실제 서비스에서는 한국어 우선으로 바꾼다.

권장 카피:

```txt
현재 위치를 바탕으로 추천했어요
```

또는 장소가 명확할 때:

```txt
서울 야경과 어울리는 음악이에요
```

---

## 6.2 TrackList

### 역할

추천 플레이리스트의 곡 목록을 보여주고, 곡 단위 액션을 제공한다.

### Figma 기준 트랙 Row

- 왼쪽 42px 앨범 컬러 블록
- 제목
- 아티스트
- 오른쪽 더보기 아이콘
- Row 높이 약 66px

### RN 구현

`FlatList`를 사용한다.

```txt
TrackList
  FlatList
    TrackRow
```

### 데이터 타입

```ts
type CuratedTrack = {
  id: string;
  title: string;
  artist: string;
  albumImageUrl?: string;
  fallbackColor: string;
  previewUrl?: string;
  externalUrl?: string;
  isLiked?: boolean;
  isSaved?: boolean;
};
```

### TrackRow UI

| 영역 | 명세 |
| --- | --- |
| 썸네일 | 42 x 42, radius 10 |
| 제목 | 16px, white, medium |
| 아티스트 | 12px, gray |
| 더보기 | 24px icon button |
| row height | 64~66px |

### TrackRow 액션

| 액션 | 동작 |
| --- | --- |
| Row 탭 | 해당 곡 재생 |
| 더보기 탭 | BottomSheet 메뉴 열기 |
| 길게 누르기 | 좋아요/저장 quick action, 후순위 |

### 더보기 메뉴 항목

```txt
좋아요
저장하기
이 곡으로 순간 저장
외부 음악 앱에서 열기
이 곡 숨기기
```

MVP에서는 `좋아요`, `저장하기`, `외부 음악 앱에서 열기`만 구현해도 충분하다.

---

## 6.3 MiniPlayer

### 역할

현재 선택한 곡과 외부 음악 앱 링크를 하단에서 확인한다.

### Figma 기준

- 시트 내부 하단에 floating 형태
- 배경 `#45343D`
- 좌측 앨범 썸네일
- 제목/가수
- 이전/외부 링크/다음

### RN 구현 위치

권장 위치:

```txt
absolute left-5 right-5 bottom: tabBarHeight + safeAreaBottom + 12
```

단, 이 페이지에서는 미니 플레이어가 곡 리스트 위에 겹쳐 보이는 디자인이므로, `TrackList`의 `contentContainerStyle`에 하단 패딩을 넉넉히 준다.

### 상태

```ts
type PlayerState = {
  currentTrack?: CuratedTrack;
  queue: CuratedTrack[];
  playlistId?: string;
};
```

---

## 6.4 BottomTabBar

메인페이지와 동일한 공통 컴포넌트를 재사용한다.

이 화면에서 탭바는 하단 고정이며, 중앙 카메라 버튼은 항상 노출한다.

카메라 버튼을 누르면 현재 선택한 곡과 현재 위치 정보를 카메라 화면으로 전달한다.

```ts
type CameraEntryParams = {
  source: 'playlist_curation';
  playlistId: string;
  trackId?: string;
  placeId?: string;
};
```

---

## 7. 상태 정의

### 7.1 화면 파라미터

홈에서 진입할 때 다음 중 하나를 전달한다.

```ts
type PlaylistCurationRouteParams = {
  playlistId?: string;
  regionName?: string;
  lat?: number;
  lng?: number;
  mood?: string;
  mode?: string;
};
```

### 7.2 Query 상태

```txt
usePlaylistCurationQuery
useTrackLikeMutation
useTrackSaveMutation
usePlayEventMutation
useSkipEventMutation
```

### 7.3 클라이언트 상태

```txt
usePlayerStore
useTravelSessionStore
```

---

## 8. API 계약 초안

### 8.1 큐레이션 상세 조회

```txt
GET /v1/playlists/:playlistId
```

또는 위치 기반으로 직접 진입할 경우:

```txt
GET /v1/playlists/curation?lat=&lng=&mood=&mode=
```

응답:

```ts
type PlaylistCurationResponse = {
  playlist: PlaylistCuration;
};
```

### 8.2 곡 재생 이벤트

```txt
POST /v1/events/play
```

```ts
type PlayEventRequest = {
  playlistId: string;
  trackId: string;
  placeId?: string;
  context: {
    source: 'playlist_curation';
    mood?: string;
    mode?: string;
  };
};
```

### 8.3 좋아요/저장

```txt
POST /v1/tracks/:trackId/like
DELETE /v1/tracks/:trackId/like
POST /v1/tracks/:trackId/save
```

---

## 9. NativeWind 스타일 기준

### 9.1 Screen

```txt
flex-1 bg-[#050916]
```

### 9.2 BackgroundImage

```txt
absolute inset-0
```

이미지는 `contentFit="cover"` 사용.

### 9.3 BottomSheet

```txt
absolute left-0 right-0 top-[200px] bottom-0 rounded-t-[20px] bg-black/60
```

Blur 적용 시:

```tsx
<BlurView intensity={40} tint="dark" />
```

### 9.4 Grabber

```txt
w-9 h-[5px] rounded-full bg-white/80 self-center mt-3
```

### 9.5 TrackRow

```txt
h-[66px] flex-row items-center px-5
```

### 9.6 MiniPlayer

```txt
absolute left-5 right-5 h-[67px] rounded-[20px] bg-[#45343D]
```

---

## 10. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 플레이리스트 로딩 | 배경 이미지 스켈레톤 + 트랙 리스트 스켈레톤 |
| 플레이리스트 없음 | “이 위치에 맞는 음악을 찾는 중이에요” fallback |
| 이미지 없음 | 기본 도시/지역 그라데이션 배경 |
| 외부 링크 열기 실패 | 토스트 + 다시 시도 옵션 |
| 외부 링크 없음 | 곡 제목/아티스트 기반 검색 링크 생성 |
| 좋아요 실패 | optimistic update 롤백 |
| 네트워크 끊김 | 캐시된 플레이리스트 표시 |

---

## 11. MVP 구현 순서

1. 정적 배경 이미지 + 하단 시트 레이아웃 구현
2. PlaylistHeroInfo 구현
3. TrackRow 및 TrackList 더미 데이터 연결
4. MiniPlayer 공통 컴포넌트 연결
5. BottomTabBar 공통 컴포넌트 연결
6. 곡 탭 시 player store 업데이트
7. 더보기 메뉴 구현
8. API 연동
9. 좋아요/저장 optimistic update
10. 위치/무드 기반 추천 파라미터 연결

---

## 12. 개발 체크리스트

- 하단 시트가 작은 화면에서도 상단 이미지를 너무 가리지 않는가?
- TrackList 스크롤 시 MiniPlayer와 겹치지 않는가?
- 더보기 버튼 터치 영역이 충분한가?
- 곡 제목이 길 때 한 줄 말줄임 처리되는가?
- 배경 이미지 로딩 실패 시 화면이 깨지지 않는가?
- 외부 링크가 없거나 열리지 않을 때 안내가 어색하지 않은가?
- 카메라 버튼 진입 시 현재 곡/장소 컨텍스트가 유지되는가?

---

## 13. 최종 구현 방향

음악 큐레이션 페이지는 Soundlog의 “추천 결과를 실제 음악 감상 앱으로 이어주는 화면”이다. 따라서 디자인의 감성보다 더 중요한 것은 사용자가 추천을 신뢰하고 외부 음악 앱 검색 링크를 빠르게 열 수 있는 흐름이다.

MVP에서는 드래그 가능한 고급 바텀시트보다 안정적인 고정형 시트로 시작하고, 이후 곡 리스트 확장/축소, blur 강도 조절, 선택 중 row 하이라이트, 외부 음악 앱 링크 품질을 단계적으로 고도화한다.

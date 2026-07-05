# Soundlog 메인페이지 제작 문서

## 1. 문서 목적

이 문서는 Figma의 `Playlist / Main` 화면을 React Native 기반 Soundlog 앱의 메인페이지로 구현하기 위한 제작 기준서이다.

Figma 기준 화면은 `390 x 844` 모바일 화면에 맞춰 설계되어 있으며, 주요 구성은 다음과 같다.

- 상단 상태 영역
- 사용자 아바타 및 상단 필터 칩
- `Music Playlist` 대표 플레이리스트 캐러셀
- `나의 무드에 맞는 음악 추천` 섹션
- `Music Log` 섹션
- 하단 외부 링크용 미니 플레이어
- 하단 탭바 및 중앙 카메라 버튼

React Native 구현 시 Figma의 절대 좌표를 그대로 옮기기보다, 모바일 앱에서 안정적으로 동작하도록 **세로 스크롤 콘텐츠 + 가로 스크롤 리스트 + 하단 고정 미니 링크 패널/탭바** 구조로 재설계한다.

---

## 2. 화면 역할

메인페이지는 Soundlog의 홈 화면이다. 사용자는 이 화면에서 현재 위치와 무드에 맞는 음악을 추천받고, 여행 중 들은 음악과 저장한 로그를 확인하며, 중앙 카메라 버튼을 통해 즉시 여행 순간을 기록한다.

### 핵심 목적

1. 현재 위치 기반 추천 플레이리스트를 빠르게 보여준다.
2. 사용자의 상황/무드 필터를 통해 추천 방향을 조정한다.
3. 현재 선택한 음악과 외부 음악 앱 링크를 항상 접근 가능하게 유지한다.
4. 여행 순간 저장 액션을 화면 어디서든 명확하게 제공한다.
5. Music Log를 통해 여행 중 쌓이는 음악 기록을 보여준다.

---

## 3. RN 구현 방향 요약

### 권장 구조

```txt
Screen Root
  SafeAreaView
    HomeHeader
    ScrollView
      TopMoodFilter
      FeaturedPlaylistSection
      MoodRecommendationSection
      MusicLogSection
    MiniPlayer fixed
    BottomTabBar fixed
```

### 구현 원칙

- 상단 상태바는 RN/Expo의 native status bar를 사용하고 직접 그리지 않는다.
- 콘텐츠 영역은 `ScrollView` 또는 섹션별 `FlatList`로 구성한다.
- 플레이리스트와 추천 카드는 `horizontal FlatList`로 구현한다.
- 미니 플레이어와 탭바는 화면 하단에 고정한다.
- 스크롤 콘텐츠에는 미니 플레이어와 탭바 높이만큼 `paddingBottom`을 준다.
- Figma의 `mix-blend-exclusion` 같은 웹 전용 효과는 RN에서 그대로 재현하지 않고, 반투명 배경/그라데이션으로 대체한다.

---

## 4. 화면 레이아웃

### 4.1 루트 화면

| 항목           | 값                            |
| -------------- | ----------------------------- |
| 기준 너비      | 390px                         |
| 기준 높이      | 844px                         |
| 배경           | 어두운 네이비 기반 그라데이션 |
| 기본 좌우 패딩 | 16~20px                       |
| 하단 고정 영역 | MiniPlayer + BottomTabBar     |

### 4.2 배경

Figma 배경은 `#090e1b` 중심의 어두운 톤과 보라색 그라데이션이 섞인 형태이다.

RN에서는 다음 방식 중 하나를 사용한다.

- `expo-linear-gradient`를 사용해 전체 배경 그라데이션 적용
- 기본 배경은 `#050916` 또는 `#090e1b`
- 보라색 포인트는 카드/프로그레스/선택 상태에만 사용

권장 색상 토큰은 다음과 같다.

| 토큰                 | 값        | 용도               |
| -------------------- | --------- | ------------------ |
| `background.primary` | `#050916` | 앱 전체 배경       |
| `background.card`    | `#080D18` | 플레이리스트 카드  |
| `background.chip`    | `#0E1E3A` | 필터 칩            |
| `border.chip`        | `#364283` | 칩 테두리          |
| `text.primary`       | `#FFFFFF` | 주요 텍스트        |
| `text.secondary`     | `#ACACAC` | 보조 텍스트        |
| `accent.purple`      | `#7A2CFF` | 진행바/선택 포인트 |
| `accent.gold`        | `#B1913A` | 추천 카드          |
| `player.background`  | `#45343D` | 미니 플레이어      |

---

## 5. 섹션별 제작 명세

## 5.1 HomeHeader

### 역할

사용자 프로필 진입과 상단 필터 칩을 제공한다.

### Figma 기준 요소

- 좌측 32px 아바타
- `All`, `Mood1`, `Mood2`, `Mood3` 칩
- 우측 프로필 아바타가 화면 우상단에 크게 노출된 버전이 있으나, 실제 앱에서는 과밀해질 수 있음

### RN 구현 권장

상단 헤더는 Safe Area 안쪽에 둔다.

```txt
row
  AvatarButton
  Horizontal ChipList
  Spacer
  ProfileButton(optional)
```

### 상태

| 상태                   | 설명                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `selectedTopFilter`    | 전체, 근처, 지역 트렌드, 내 취향, 저장 많은 등 추천 범위 필터 |
| `user.profileImageUrl` | 사용자 프로필 이미지                                          |

### 개발 메모

- 초기 MVP에서는 `Mood1`, `Mood2` 대신 실제 서비스 언어로 바꾼다.
- 상단 필터는 무드가 아니라 추천 범위/소스 필터로 사용한다.
- 감정 키워드는 `나의 무드에 맞는 음악 추천` 섹션의 칩으로 분리한다.

권장 문구:

```txt
전체 / 근처 / 지역 트렌드 / 내 취향 / 저장 많은
```

---

## 5.2 FeaturedPlaylistSection

### 역할

현재 위치 또는 선택 지역에 맞는 대표 플레이리스트를 보여준다.

### Figma 기준 요소

- 타이틀: `Music Playlist`
- 카드 크기: 약 `196 x 276`
- 카드 내 칩: `12곡`, `40:00분`
- 카드 타이틀: `부산`
- 설명: `부산광역시에 어울리는 노래를 추천해드립니다.`
- 카드 리스트 하단 진행바

### RN 구현 권장

`FlatList horizontal` 또는 `react-native-reanimated-carousel`을 사용할 수 있다.

MVP에서는 외부 캐러셀 라이브러리 없이 `FlatList horizontal pagingEnabled`로 충분하다.

### 컴포넌트 구조

```txt
FeaturedPlaylistSection
  SectionTitle
  FeaturedPlaylistCarousel
    FeaturedPlaylistCard
  CarouselProgress
```

### 카드 UI

| 속성             | 값                             |
| ---------------- | ------------------------------ |
| width            | 168~196                        |
| height           | 240~276                        |
| radius           | 20                             |
| background       | dark gradient or image overlay |
| padding          | 12~16                          |
| title size       | 28~30                          |
| description size | 12~14                          |

### 데이터 타입

```ts
type FeaturedPlaylist = {
  id: string;
  regionName: string;
  title: string;
  description: string;
  trackCount: number;
  durationText: string;
  coverImageUrl?: string;
  source: 'location' | 'trend' | 'personalized';
};
```

### 빈 상태

| 상황           | UI                                                    |
| -------------- | ----------------------------------------------------- |
| 위치 권한 없음 | “위치를 켜면 지금 장소에 맞는 음악을 추천해드릴게요.” |
| 추천 로딩      | 카드 스켈레톤                                         |
| 추천 실패      | 재시도 버튼                                           |
| 추천 없음      | 기본 지역/무드 추천 노출                              |

---

## 5.3 MoodRecommendationSection

### 역할

사용자의 현재 무드에 맞는 음악 추천을 보여준다.

### Figma 기준 요소

- 타이틀: `나의 무드에 맞는 음악 추천`
- 칩: `전체`, `잔잔한`, `신나는`, `감성적인`, `청량한`, `활기찬`, `로컬한`
- 카드: 보라색, 골드, 다크 계열의 정사각형/라운드 카드
- 카드 텍스트: `Music Genre`, `Music`, `and let the city`

### RN 구현 권장

MoodRecommendationSection은 앱 추천 경험의 중심이다. Figma의 더미 텍스트를 실제 추천 카피로 대체한다.

권장 칩:

```txt
전체 / 잔잔한 / 신나는 / 감성적인 / 청량한 / 활기찬 / 로컬한
```

여행 모드와 분리되는 감정/분위기 후보:

```txt
몽환적인 / 낭만적인 / 차분한 / 에너지 있는
```

### 컴포넌트 구조

```txt
MoodRecommendationSection
  SectionTitle
  MoodChipList
  Horizontal RecommendationCardList
```

### 카드 데이터

```ts
type MoodRecommendation = {
  id: string;
  title: string;
  subtitle?: string;
  mood: string;
  color: string;
  imageUrl?: string;
  playlistId: string;
};
```

### 상호작용

| 액션           | 동작                             |
| -------------- | -------------------------------- |
| 칩 선택        | 추천 리스트 재정렬 또는 재요청   |
| 카드 탭        | 플레이리스트 상세 화면 이동      |
| 카드 길게 누름 | 저장/좋아요 quick action, 후순위 |

### 구현 메모

- 칩 선택 즉시 API를 호출하면 요청이 많아질 수 있다.
- MVP에서는 칩 선택 시 로컬 필터링 또는 debounce 300ms 적용을 권장한다.
- 선택 칩은 배경/테두리/텍스트 색으로 명확히 구분한다.

---

## 5.4 MusicLogSection

### 역할

여행 중 들었거나 저장한 음악 로그를 시각적으로 보여준다.

### Figma 기준 요소

- 타이틀: `Music Log`
- 흰색 라운드 카드 3개
- 좌우 카드는 약간 회전된 필름/카드 형태

### RN 구현 권장

MVP에서는 복잡한 회전 애니메이션보다 카드 리스트로 시작한다. 다만 Figma의 감성은 살리기 위해 첫 번째/세 번째 카드에 `transform: rotate()`를 적용할 수 있다.

### 컴포넌트 구조

```txt
MusicLogSection
  SectionTitle
  Horizontal MomentLogCardList
```

### 카드 데이터

```ts
type MusicLogItem = {
  id: string;
  imageUrl?: string;
  placeName: string;
  trackTitle?: string;
  artistName?: string;
  createdAt: string;
};
```

### 빈 상태

아직 로그가 없으면 다음 메시지를 보여준다.

```txt
오늘의 여행 순간을 저장해보세요.
```

CTA:

```txt
순간 저장하기
```

### 구현 메모

- Music Log는 사진 없는 로그도 지원해야 한다.
- 이미지가 없을 경우 관광공사 장소 이미지 또는 기본 그라데이션 배경을 사용한다.
- 로그 카드 탭 시 해당 Moment Log 상세 또는 Recap 후보 화면으로 이동한다.

---

## 5.5 MiniPlayer

### 역할

현재 선택한 음악과 외부 음악 앱 링크를 화면 하단에서 항상 확인할 수 있게 한다.

### Figma 기준 요소

- 위치: 탭바 위 고정
- 크기: 약 `350 x 67`
- 배경: `#45343D`
- 좌측 앨범 썸네일
- 중앙 곡 제목/가수
- 우측 이전/외부 링크/다음 버튼

### RN 구현 권장

MiniPlayer는 스크롤 콘텐츠 안에 넣지 않고 `absolute` 또는 레이아웃 하단 고정 영역에 둔다.

### 상태

```ts
type PlayerState = {
  currentTrack?: Track;
  queue: Track[];
  source: 'external-link' | 'none';
};
```

### 빈 상태

선택한 곡이 없을 경우 다음 중 하나를 선택한다.

- 미니 플레이어 숨김
- “추천 음악을 열어보세요” 상태로 축소 표시

권장안:

```txt
선택한 음악이 없으면 MiniPlayer를 숨긴다.
```

이유는 메인페이지 하단 공간이 부족하기 때문이다.

### 상호작용

| 액션             | 동작                                    |
| ---------------- | --------------------------------------- |
| 미니 플레이어 탭 | 풀 플레이어 화면 또는 bottom sheet 열기 |
| 이전             | 이전 곡으로 이동하고 외부 링크 열기     |
| 외부 링크        | 현재 곡의 외부 음악 앱 검색 링크 열기   |
| 다음             | 다음 곡으로 이동하고 피드백 이벤트 기록 |

---

## 5.6 BottomTabBar

### 역할

앱의 주요 영역으로 이동한다.

### Figma 기준 요소

- 아이콘 5개
- 중앙 큰 원형 카메라 버튼
- 좌측부터 홈, 위치, 카메라, 좋아요, 마이페이지로 보임

### RN 구현 권장

Expo Router의 Tabs를 사용하되, 중앙 카메라 버튼은 custom tab button으로 처리한다.

탭 구성 권장:

| 탭        | 경로             | 역할                                 |
| --------- | ---------------- | ------------------------------------ |
| 홈        | `/` 또는 `/home` | 메인 추천                            |
| 위치/탐색 | `/places`        | 주변 장소 또는 지도, MVP 후순위 가능 |
| 카메라    | action button    | 순간 저장                            |
| 보관함    | `/library`       | 좋아요 음악/플레이리스트             |
| 마이      | `/my`            | 계정/연동/설정                       |

MVP에서 위치 탭이 아직 없다면 `Recap` 탭으로 대체할 수 있다.

권장 MVP 탭:

```txt
홈 / Recap / 카메라 / 보관함 / 마이
```

---

## 6. 전체 데이터 흐름

### 6.1 홈 진입 시

1. 온보딩 완료 여부 확인
2. 위치 권한 상태 확인
3. 현재 위치 조회
4. 주변 관광지/장소 맥락 조회
5. 대표 플레이리스트 조회
6. 무드 추천 목록 조회
7. Music Log 최근 기록 조회

### 6.2 태그 선택 시

1. 사용자가 상황/무드 칩 선택
2. 로컬 상태 업데이트
3. 추천 API 재요청 또는 기존 목록 재정렬
4. 추천 카드 UI 업데이트

### 6.3 카메라 버튼 클릭 시

1. 현재 여행 세션 확인
2. 카메라 권한 확인
3. 카메라 화면 이동
4. 촬영 시점의 위치/음악/시간을 함께 캡처
5. Moment Log 생성

---

## 7. 메인페이지 상태 정의

### 7.1 HomeScreenState

```ts
type HomeScreenState = {
  selectedTopFilter: string;
  selectedMoodFilter: string;
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  isLocationEnabled: boolean;
  isRefreshing: boolean;
};
```

### 7.2 서버 상태

TanStack Query로 관리한다.

```txt
useNearbyPlacesQuery
useFeaturedPlaylistsQuery
useMoodRecommendationsQuery
useRecentMusicLogsQuery
useCurrentUserQuery
```

### 7.3 클라이언트 상태

Zustand로 관리한다.

```txt
useTravelSessionStore
usePlayerStore
useHomeFilterStore
```

---

## 8. API 계약 초안

### 8.1 대표 플레이리스트 조회

```txt
GET /v1/home/featured-playlists?lat=&lng=&filter=
```

응답:

```ts
type FeaturedPlaylistsResponse = {
  items: FeaturedPlaylist[];
};
```

### 8.2 무드 추천 조회

```txt
GET /v1/home/mood-recommendations?lat=&lng=&mood=&mode=
```

응답:

```ts
type MoodRecommendationsResponse = {
  items: MoodRecommendation[];
};
```

### 8.3 최근 Music Log 조회

```txt
GET /v1/music-logs/recent
```

응답:

```ts
type RecentMusicLogsResponse = {
  items: MusicLogItem[];
};
```

---

## 9. 컴포넌트 분리안

```txt
src/screens/home/HomeScreen.tsx
src/features/home/components/HomeHeader.tsx
src/features/home/components/FilterChip.tsx
src/features/home/components/FeaturedPlaylistSection.tsx
src/features/home/components/FeaturedPlaylistCard.tsx
src/features/home/components/CarouselProgress.tsx
src/features/home/components/MoodRecommendationSection.tsx
src/features/home/components/MoodRecommendationCard.tsx
src/features/home/components/MusicLogSection.tsx
src/features/home/components/MusicLogCard.tsx
src/features/player/components/MiniPlayer.tsx
src/widgets/bottom-tab/BottomTabBar.tsx
```

Expo Router 사용 시 화면 파일은 다음처럼 둘 수 있다.

```txt
app/(tabs)/index.tsx
app/(tabs)/recap.tsx
app/(tabs)/library.tsx
app/(tabs)/my.tsx
app/camera/index.tsx
```

---

## 10. NativeWind 스타일 기준

### 10.1 Screen

```txt
flex-1 bg-[#050916]
```

그라데이션이 필요하면 `LinearGradient` 컴포넌트로 감싼다.

### 10.2 SectionTitle

```txt
text-white text-[22px] font-semibold
```

Figma는 24px를 사용하지만, RN 실기기에서는 20~22px가 더 안정적이다. 디자인 유지가 우선이면 24px를 사용한다.

### 10.3 Chip

```txt
rounded-full border border-[#364283] bg-[#0E1E3A] px-3 py-2
```

선택 상태:

```txt
bg-[#243A75] border-[#7A8CFF]
```

### 10.4 FeaturedPlaylistCard

```txt
w-[180px] h-[260px] rounded-[20px] overflow-hidden p-4
```

### 10.5 MiniPlayer

```txt
absolute left-5 right-5 bottom-[86px] h-[67px] rounded-[20px] bg-[#45343D]
```

실제 bottom 값은 탭바 높이와 safe area inset을 반영해 계산한다.

---

## 11. 반응형/기기 대응

Figma는 390px 기준이므로 작은 기기와 큰 기기를 모두 고려해야 한다.

### 작은 화면

- 좌우 패딩을 16px로 줄인다.
- FeaturedPlaylistCard width를 화면 너비의 44~48%로 계산한다.
- MiniPlayer는 좌우 16px를 유지한다.
- 칩 리스트는 반드시 horizontal scroll을 허용한다.

### 큰 화면

- 카드가 지나치게 커지지 않도록 `maxWidth`를 둔다.
- 홈 콘텐츠 최대 너비는 430~480px로 제한하는 것을 고려한다.

---

## 12. 접근성

메인페이지는 이동 중 사용하는 화면이므로 터치 영역과 접근성이 중요하다.

- 칩 터치 영역은 최소 44px 높이를 권장한다.
- 카메라 버튼은 명확한 accessibility label을 가진다.
- 미니 플레이어 버튼은 `이전 곡`, `음악 링크 열기`, `다음 곡` label을 제공한다.
- 색상만으로 선택 상태를 구분하지 않고, 선택 칩에는 텍스트/테두리 차이를 함께 준다.

예시:

```tsx
accessibilityRole = 'button';
accessibilityLabel = '순간 저장 카메라 열기';
```

---

## 13. 예외 상태

| 상황             | 화면 처리                               |
| ---------------- | --------------------------------------- |
| 위치 권한 없음   | 대표 추천 대신 위치 권한 안내 카드 노출 |
| 위치 조회 실패   | 최근 위치 또는 지역 직접 선택 안내      |
| 추천 API 실패    | 기존 캐시 데이터 유지 + 재시도 버튼     |
| 추천 데이터 없음 | 기본 무드 추천 표시                     |
| Music Log 없음   | 빈 카드 대신 순간 저장 유도             |
| 현재 재생 없음   | MiniPlayer 숨김                         |
| 관광 이미지 없음 | 기본 그라데이션 커버 사용               |

---

## 14. MVP 구현 순서

1. 정적 HomeScreen 레이아웃 구현
2. NativeWind 스타일 토큰 정리
3. FeaturedPlaylistSection 더미 데이터 연결
4. MoodRecommendationSection 더미 데이터 연결
5. MusicLogSection 더미 데이터 연결
6. MiniPlayer 고정 배치
7. BottomTabBar 중앙 카메라 버튼 구성
8. 칩 선택 상태 구현
9. 위치 권한 상태 UI 연결
10. 추천 API 연결
11. Music Log API 연결
12. 외부 음악 앱 링크 연결

---

## 15. 개발 체크리스트

### 레이아웃

- 홈 콘텐츠가 하단 미니 플레이어와 겹치지 않는다.
- 칩 리스트는 작은 화면에서도 잘리지 않고 스크롤된다.
- 대표 플레이리스트 카드는 가로 스크롤된다.
- Music Log 카드는 화면 너비 밖으로 자연스럽게 이어진다.
- 탭바와 중앙 카메라 버튼 위치가 safe area를 침범하지 않는다.

### 상태

- 칩 선택 상태가 즉시 반영된다.
- 위치 권한 거부 상태가 별도로 보인다.
- 추천 로딩/실패/빈 상태가 모두 존재한다.
- 현재 선택한 곡이 없을 때 MiniPlayer 정책이 적용된다.

### 데이터

- 추천 카드에 지역명, 곡 수, 재생 시간, 설명이 표시된다.
- Mood 추천 카드가 실제 mood/filter 값과 연결된다.
- Music Log가 최근 여행 로그와 연결된다.
- 카메라 버튼 클릭 시 현재 위치/음악 상태를 넘길 수 있다.

### UX

- 주요 액션이 한 손으로 누르기 쉽다.
- 텍스트가 카드 밖으로 넘치지 않는다.
- 이미지 로딩 실패 시 화면이 깨지지 않는다.
- 홈 진입 후 첫 추천 로딩 시간이 길면 스켈레톤을 보여준다.

---

## 16. 최종 구현 방향

메인페이지는 Soundlog에서 가장 중요한 화면이다. 이 화면은 단순히 여러 섹션을 나열하는 홈이 아니라, 사용자가 현재 여행 중 어떤 장소에 있고 어떤 음악을 들을지 결정하는 중심 허브이다.

따라서 구현 우선순위는 다음과 같다.

1. 현재 위치/무드 기반 추천이 잘 보이는가
2. 음악 재생 상태가 항상 접근 가능한가
3. 순간 저장 카메라 버튼이 명확한가
4. 여행 로그가 쌓이는 느낌이 보이는가
5. 작은 화면에서도 하단 영역이 겹치지 않는가

Figma의 감성은 유지하되, RN에서는 절대 좌표 기반 화면이 아니라 실제 모바일 앱에 맞는 유연한 레이아웃으로 구현한다.

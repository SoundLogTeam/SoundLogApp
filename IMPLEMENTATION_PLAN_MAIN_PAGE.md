# Soundlog 메인페이지 구현 계획

## 1. 작업 목표

현재 placeholder 수준으로 구현된 홈 화면을 Figma `Playlist / Main` 기준에 맞춰 실제 MVP 메인페이지 형태로 개선한다. 이번 작업은 실제 위치 권한, 관광공사 API, 음악 플랫폼 SDK를 붙이는 단계가 아니라, 문서화된 메인페이지 UI/상태 구조를 코드 구조로 반영하고 mock 데이터 기반으로 사용 흐름을 확인하는 단계이다.

## 2. 사용자 목표

사용자는 앱 첫 화면에서 현재 장소 기반 대표 플레이리스트, 무드 기반 추천, Music Log, 현재 재생 중인 곡, 중앙 카메라 버튼을 한 화면 흐름 안에서 확인할 수 있어야 한다.

## 3. 범위

### 포함

- 홈 화면 컴포넌트 분리
- Figma 기준 레이아웃 보정
- 대표 플레이리스트 horizontal list
- 상단 필터 칩
- 무드 필터 칩
- 무드 추천 카드
- Music Log 카드
- MiniPlayer 하단 고정 배치 검증
- mock API + TanStack Query hook 연결
- 로딩/빈/에러 상태 skeleton 또는 fallback
- 플레이리스트 카드 탭 시 `/playlist/[id]` 이동
- 추천 카드 탭 시 player store 업데이트

### 제외

- 실제 위치 권한 요청
- 실제 관광공사 API 호출
- 실제 음악 재생 엔진
- 카메라 권한 및 촬영 기능
- 사용자 프로필/로그인
- Recap 생성

## 4. 현재 상태

현재 홈 화면은 [app/(tabs)/index.tsx](/Users/manwook-han/Desktop/hmw/code/soundlog/app/(tabs)/index.tsx)에 대부분의 UI가 한 파일로 작성되어 있다.

이미 존재하는 기반:

- Expo Router 탭 구조
- NativeWind 설정
- `Screen`, `Chip`, `MiniPlayer` 공통 컴포넌트
- `useHomeFilterStore`
- `usePlayerStore`
- mock 데이터
- `homeApi` mock fetcher

## 5. 구현 방향

홈 화면은 `app/(tabs)/index.tsx`를 얇은 조립 화면으로 만들고, 실제 UI는 `src/components/home` 아래로 분리한다.

```txt
app/(tabs)/index.tsx
  HomeScreen

src/components/home/
  HomeHeader.tsx
  FeaturedPlaylistSection.tsx
  FeaturedPlaylistCard.tsx
  CarouselProgress.tsx
  MoodRecommendationSection.tsx
  MoodRecommendationCard.tsx
  MusicLogSection.tsx
  MusicLogCard.tsx
  HomeStateMessage.tsx

src/api/homeApi.ts
src/mocks/homeMocks.ts
src/types/domain.ts
```

초기 구조는 여전히 flat 구조를 유지하되, 홈 전용 UI만 `components/home`으로 묶는다. `features/` 구조는 아직 도입하지 않는다.

## 6. 데이터 흐름

### 홈 진입

1. `HomeScreen` 렌더링
2. `useFeaturedPlaylistsQuery`
3. `useMoodRecommendationsQuery({ topFilter, moodFilter })`
4. `useRecentMusicLogsQuery`
5. 섹션별 로딩/에러/빈 상태 반영

### 상단 필터 선택

1. `selectedTopFilter` 업데이트
2. 현재는 mock filter 상태와 UI 선택 상태만 반영
3. 후속 실제 API 연결 시 음악 분위기/취향 카테고리 파라미터로 사용

상단 필터의 역할:

```txt
전체 / 잔잔한 / 청량한 / 감성적인 / 신나는
```

이 필터는 사용자의 현재 음악 분위기 선호를 나타낸다.

### 무드 필터 선택

1. `selectedMoodFilter` 업데이트
2. mock 데이터에서는 선택 칩만 UI 반영
3. 후속 실제 API 연결 시 여행 모드/상황 파라미터로 사용

무드 필터의 역할:

```txt
전체 / 드라이브 / 산책 / 시원한 바람 / 활기찬 / 신나는
```

이 필터는 사용자의 여행 상황 또는 행동 맥락을 나타낸다.

### 추천 카드 선택

1. recommendation card 탭
2. `usePlayerStore.setTrack(track)` 호출
3. MiniPlayer 노출

### 대표 플레이리스트 선택

1. featured playlist card 탭
2. `/playlist/[id]` 이동

## 7. 상태 소유권

| 상태 | 위치 | 설명 |
| --- | --- | --- |
| 상단 필터 | `useHomeFilterStore` | 전체/잔잔한/청량한/감성적인/신나는 |
| 무드 필터 | `useHomeFilterStore` | 전체/드라이브/산책/시원한 바람/활기찬/신나는 |
| 현재 곡 | `usePlayerStore` | 추천 카드 또는 트랙 row에서 설정 |
| 홈 데이터 | TanStack Query | mock API로 로딩/에러 상태 테스트 가능 |

## 8. API/Hook 설계

새 hook 파일을 추가한다.

```txt
src/api/homeQueries.ts
```

```ts
useFeaturedPlaylistsQuery()
useMoodRecommendationsQuery(params: {
  topFilter: string;
  moodFilter: string;
})
useRecentMusicLogsQuery()
```

`homeApi`는 이미 존재하는 mock API를 유지한다. `mockDelay`는 `shouldFail` 옵션을 제공하므로 에러 상태도 테스트 가능하다.

## 9. UI 상세 계획

### 9.1 HomeHeader

- 좌측 32px avatar placeholder
- 상단 필터 horizontal scroll
- 필터 선택 상태 반영
- 우측 프로필 버튼은 이번 범위에서는 생략하거나 spacer만 둔다.

### 9.2 FeaturedPlaylistSection

- 타이틀 `Music Playlist`
- 180~196px 폭 카드 horizontal `ScrollView + map`
- 카드 내부 `trackCount`, `durationText` chip
- 카드 title/description
- 카드 하단 progress bar
- 로딩 시 카드 skeleton
- 빈 상태 시 위치 권한 유도 카드 대신 “추천을 준비 중이에요” fallback

주의: 홈은 세로 `ScrollView`를 부모로 사용하므로, 내부 horizontal list는 `FlatList` 대신 `ScrollView + map`으로 구현한다. 현재 mock/MVP 데이터 수가 적기 때문에 virtualized list가 필요하지 않다. 이후 데이터가 커지면 부모 구조를 `SectionList` 또는 별도 화면 구조로 재검토한다.

### 9.3 MoodRecommendationSection

- 타이틀 `나의 무드에 맞는 음악 추천`
- 무드 chip horizontal scroll
- 추천 카드 horizontal `ScrollView + map`
- 카드 탭 시 현재 곡 설정
- 텍스트 overflow 방지

### 9.4 MusicLogSection

- 타이틀 `Music Log`
- 3개 이상 카드 horizontal `ScrollView + map`
- 1번째/3번째 카드만 가벼운 rotate 적용
- 이미지 없는 상태에서는 밝은 카드 배경 유지
- 빈 상태 시 `오늘의 여행 순간을 저장해보세요.` 표시

### 9.5 MiniPlayer

- 현재 곡이 있을 때만 노출
- 탭바 위 고정 위치 유지
- 홈 ScrollView `paddingBottom`을 MiniPlayer + TabBar 높이만큼 확보

하단 여백 공식:

```txt
tabBarHeight = 76 + safeAreaBottom
miniPlayerHeight = 67
miniPlayerGap = 12
contentBottomPadding = tabBarHeight + miniPlayerHeight + miniPlayerGap + 32
miniPlayerBottom = tabBarHeight + miniPlayerGap
```

현재 `MiniPlayer`는 내부에서 safe area를 반영하고 있으므로, 홈 콘텐츠 padding도 같은 상수를 공유하도록 후속 구현에서 `src/constants/layout.ts`를 추가한다.

## 10. 예외 상태

| 상황 | 처리 |
| --- | --- |
| featured playlists 로딩 | 카드 skeleton 2개 |
| featured playlists 실패 | 재시도 가능한 에러 카드 |
| featured playlists 없음 | fallback 안내 카드 |
| mood recommendations 로딩 | 사각 추천 skeleton 3개 |
| mood recommendations 실패 | 섹션 내 에러 메시지 |
| music logs 없음 | 빈 상태 카드 |
| 현재 곡 없음 | MiniPlayer 숨김 |
| 작은 화면 | 모든 칩/카드는 horizontal scroll 유지 |
| Android rotate 미지원/시각 오류 | MusicLog 카드 rotate를 제거하고 정렬 카드로 fallback |

## 11. 제품 엣지케이스

이번 작업은 mock UI 구현이므로 사용자에게 즉시 결정받아야 하는 제품 엣지케이스는 없다.

다만 다음 작업에서 실제 기능을 붙일 때는 질문해야 한다.

- 위치 권한이 없을 때 홈 추천을 샘플로 보여줄지, 지역 직접 선택을 먼저 보여줄지
- 여행 세션이 시작되지 않았을 때 카메라 버튼을 활성화할지
- 음악 플랫폼 미연동 상태에서 추천 카드 탭 시 MiniPlayer를 보여줄지, 연동 안내를 먼저 보여줄지

이번 범위에서는 위 항목을 모두 mock/fallback 상태로만 처리한다.

## 12. 구현 단계

1. `src/constants/layout.ts` 추가
2. `src/api/homeQueries.ts` 추가
3. 홈 전용 컴포넌트 폴더 생성
4. `HomeHeader` 분리
5. `FeaturedPlaylistSection`, `FeaturedPlaylistCard`, 단순 `CarouselProgress` 구현
6. `MoodRecommendationSection`, `MoodRecommendationCard` 구현
7. `MusicLogSection`, `MusicLogCard` 구현
8. 섹션별 fallback을 각 섹션 내부에 직접 구현하고, 별도 `HomeStateMessage`는 만들지 않는다.
9. [app/(tabs)/index.tsx](/Users/manwook-han/Desktop/hmw/code/soundlog/app/(tabs)/index.tsx)를 조립 화면으로 축소
10. 작은 화면과 하단 겹침을 고려해 spacing 조정
11. 타입체크, Expo Doctor, iOS export smoke test 실행

## 13. 검증 계획

```txt
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
```

수동 확인:

- 홈 화면 진입
- 상단 필터 선택 상태 변경
- 무드 필터 선택 상태 변경
- 추천 카드 탭 후 MiniPlayer 노출
- 대표 플레이리스트 카드 탭 후 상세 화면 이동
- 하단 탭바/미니 플레이어 겹침 없음

## 14. 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 한 화면에 horizontal list가 많아 스크롤 충돌 가능 | 세로 ScrollView 안에는 FlatList를 넣지 않고 horizontal ScrollView + map만 사용한다. |
| MiniPlayer와 TabBar가 겹칠 수 있음 | `src/constants/layout.ts`에 하단 여백 공식을 두고 Screen/Home/MiniPlayer가 같은 기준을 사용한다. |
| NativeWind className이 커스텀 컴포넌트에서 누락될 수 있음 | 공통 컴포넌트 props에 `className`을 명시하고 RN 기본 컴포넌트까지 전달한다. |
| mock API hook 도입으로 UI가 복잡해질 수 있음 | hook은 `homeQueries.ts` 하나로 제한하고 실제 API 전환 전까지 단순 유지한다. |
| Figma와 픽셀 차이가 날 수 있음 | 이번 단계는 RN 구조 안정화가 우선이며, 픽셀 퍼펙트 보정은 다음 UI polish 단계에서 진행한다. |

## 15. Claude 리뷰 반영 사항

Claude 리뷰 결과 다음 항목을 계획에 반영했다.

- 세로 `ScrollView` 내부의 `FlatList` 사용을 피하고, mock/MVP 데이터는 `ScrollView + map`으로 구현한다.
- MiniPlayer와 TabBar 하단 간격 공식을 명시하고 `layout.ts` 상수로 공유한다.
- 상단 필터는 음악 분위기 선호, 무드 필터는 여행 상황/행동 맥락으로 역할을 분리한다.
- `HomeStateMessage`는 과한 추상화로 보고 만들지 않고 섹션 내부 fallback으로 처리한다.
- MusicLog 카드 회전 효과는 Android에서 문제가 있으면 제거 가능한 장식 효과로 둔다.

## 16. 다음 구현 전 확정

이번 메인페이지 구현은 mock UI 단계이므로 사용자에게 추가로 확인해야 할 제품 결정 없이 진행 가능하다. 실제 위치 권한, 음악 플랫폼 연동, 카메라 저장 정책을 건드리는 다음 단계에서는 별도 설계와 질문이 필요하다.

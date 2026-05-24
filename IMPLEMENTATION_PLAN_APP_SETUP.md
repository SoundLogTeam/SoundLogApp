# Soundlog 초기 앱 세팅 구현 계획

## 1. 작업 목표

Soundlog React Native 앱 개발을 시작하기 위한 Expo 기반 프로젝트 뼈대를 구축한다. 이번 작업의 목적은 메인페이지, 음악 큐레이션 페이지, 리캡 공유 페이지를 바로 구현할 수 있도록 라우팅, 스타일링, 상태 관리, API 계층, mock 데이터, 공통 컴포넌트 구조를 먼저 준비하는 것이다.

이번 작업에서는 실제 관광공사 API, 음악 플랫폼 SDK, 카메라 촬영, 위치 권한 요청을 완성하지 않는다. 대신 해당 기능을 붙일 수 있는 구조와 타입, placeholder 화면, mock 데이터를 만든다.

## 2. 기술 스택 결정

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 앱 프레임워크 | Expo + React Native | RN 입문과 MVP 속도에 유리하고 위치/카메라/이미지/권한 기능을 붙이기 쉽다. |
| 언어 | TypeScript | 관광지, 음악, 로그, Recap 데이터 타입 안정성 필요 |
| 라우팅 | Expo Router | 파일 기반 라우팅으로 탭/스택 구조를 빠르게 구성 |
| 스타일링 | NativeWind + Tailwind CSS | 기존 React/Tailwind 감각을 RN에 가져오기 좋음 |
| 서버 상태 | TanStack Query | 추천/Recap/로그 API 캐싱, 로딩, 에러 처리 |
| 클라이언트 상태 | Zustand | 현재 여행 세션, 선택 태그, 플레이어 상태 관리 |
| 폼/검증 | 후속 도입 | 온보딩 구현 시 React Hook Form + Zod를 추가한다. 초기 범위에서는 제외 |
| 로컬 저장 | 초기 범위 제외, 후속 AsyncStorage 검토 | Expo Go 검증을 우선하므로 native module인 MMKV는 제외 |
| 이미지 | expo-image | 관광 이미지와 Recap 이미지 캐싱 |
| 그라데이션 | expo-linear-gradient | Figma의 어두운 그라데이션 배경 구현 |
| 아이콘 | @expo/vector-icons | Expo 기본 생태계와 호환성이 높고 초기 번들 리스크가 낮음 |

## 3. 기능 계약

### 사용자 목표

사용자는 앱을 실행했을 때 Soundlog의 기본 화면 구조를 확인하고, 하단 탭으로 홈/Recap/보관함/마이 화면을 이동할 수 있어야 한다. 중앙 카메라 액션과 미니 플레이어/추천 화면을 구현할 수 있는 기본 구조가 준비되어야 한다.

### 진입점

- 앱 실행
- `/` 또는 `/(tabs)` 홈

### 종료점

- 초기 앱이 Expo dev server에서 정상 실행된다.
- 각 탭의 placeholder 화면이 보인다.
- 기본 provider, theme, 상태 store, mock API 구조가 준비된다.

### 영향을 받는 화면

- 홈
- 음악 큐레이션 상세
- Recap 공유
- 보관함
- 마이페이지
- 카메라 placeholder

## 4. 파일/모듈 구조

Expo Router 기준으로 다음 구조를 만든다. 초기 MVP는 팀 학습 비용을 낮추기 위해 FSD식 깊은 구조가 아니라 납작한 구조로 시작한다. 기능이 커지면 `features/`, `entities/`로 점진 분리한다.

```txt
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    recap.tsx
    library.tsx
    my.tsx
  playlist/[id].tsx
  recap-share/[id].tsx
  camera/index.tsx

src/
  providers/
    AppProviders.tsx
    queryClient.ts
  components/
    Screen.tsx
    AppText.tsx
    IconButton.tsx
    Chip.tsx
    EmptyState.tsx
    MiniPlayer.tsx
  constants/
    colors.ts
    spacing.ts
  types/
    domain.ts
  mocks/
    homeMocks.ts
    playlistMocks.ts
    recapMocks.ts
  api/
    homeApi.ts
    playlistApi.ts
    recapApi.ts
    mockDelay.ts
  store/
    playerStore.ts
    travelSessionStore.ts
    homeFilterStore.ts
```

라우팅은 루트 `Stack` 안에 `(tabs)`와 독립 화면을 분리한다.

```txt
Root Stack
  (tabs)        header hidden
  playlist/[id]
  recap-share/[id]
  camera        modal or full screen
```

중앙 카메라 버튼은 `(tabs)/_layout.tsx`의 `Tabs.Screen`에서 `tabBarButton`을 커스터마이징해 구현한다.

## 5. 상태 소유권

### TanStack Query

이번 작업에서는 실제 API 호출 대신 mock fetcher를 사용한다. Query 구조만 준비한다.

- featured playlists
- mood recommendations
- recent music logs
- recap list
- playlist detail
- recap share detail

### Zustand

초기 store는 세 개로 나눈다. 실제 오디오 스트리밍은 이번 범위에 포함하지 않고, UI 상태와 외부 음악 앱 연동을 대비한 최소 상태만 둔다.

| Store | 책임 |
| --- | --- |
| `usePlayerStore` | 현재 곡, 재생 UI 상태, 현재 playlistId, 외부 재생 source |
| `useTravelSessionStore` | 여행 세션 상태, 시작/종료 시각, 현재 위치 placeholder, 선택 모드 |
| `useHomeFilterStore` | 홈 상단 필터와 무드 필터 |

초기 타입:

```ts
type TravelSession = {
  id: string;
  status: 'idle' | 'active' | 'ended';
  startedAt?: string;
  endedAt?: string;
};
```

## 6. API 기대 구조

실제 API는 아직 없으므로 mock API 계층을 둔다.

```txt
src/api/mockDelay.ts
src/api/homeApi.ts
src/api/playlistApi.ts
src/api/recapApi.ts
```

초기 응답은 문서에 정의된 타입과 맞춘다.

`mockDelay`는 loading/error 상태 테스트를 위해 `delayMs`, `shouldFail` 옵션을 받는다.

## 7. 권한 요구사항

이번 초기 세팅에서는 실제 권한 요청을 하지 않는다. 다만 이후 권한 플로우를 위해 다음 화면만 placeholder로 둔다.

- 카메라 placeholder
- 위치 권한 안내 placeholder
- 음악 플랫폼 연동 placeholder

실제 권한 요청은 기능별 설계 후 구현한다.

초기 검증 환경은 Expo Go로 둔다. 따라서 native custom dev client가 필요한 기능은 이번 작업에서 설치하지 않는다.

## 8. 로딩/빈/에러/오프라인 상태

초기 세팅에서는 공통 UI 컴포넌트만 준비한다.

- `EmptyState`
- query error placeholder
- loading placeholder

오프라인 재시도 큐는 이번 범위에 포함하지 않는다.

## 9. 엣지케이스 검토

이번 작업에서 사용자 결정이 필요한 주요 제품 엣지케이스는 없다. 다음 항목은 기능 구현 단계에서 다시 질문해야 한다.

- 카메라 버튼이 여행 세션 시작 전에도 활성화되어야 하는지
- 위치 권한 거부 시 수동 지역 선택을 어느 화면에서 제공할지
- 음악 플랫폼 미연동 상태에서 재생 버튼을 어떻게 표현할지
- Moment Log가 사진 없이도 저장 가능한지
- Recap 공유는 OS 기본 공유만 먼저 할지, Instagram/Snapchat 직접 공유를 할지

이번 초기 세팅에서는 위 항목을 모두 placeholder/fallback 가능한 구조로만 둔다.

## 10. 구현 단계

1. 현재 디렉터리가 기획 문서로 이미 채워져 있으므로 `create-expo-app`을 현재 디렉터리에 직접 실행하지 않는다. 필요 시 임시 디렉터리에 공식 템플릿을 생성해 버전/설정만 참고하고, 현재 루트에는 필요한 파일을 통제해서 반영한다.
2. Expo Router, NativeWind, TanStack Query, Zustand, expo-image, expo-linear-gradient를 설치한다.
3. NativeWind/Tailwind/Babel/Metro 설정을 적용한다.
4. NativeWind smoke test용 화면/컴포넌트를 만들고 Expo start/typecheck로 className 적용 가능성을 확인한다. 실패 시 구현을 중단하고 사용자에게 StyleSheet 전환 여부를 묻는다.
5. Expo Router 루트 Stack 레이아웃과 탭 레이아웃을 만든다.
6. AppProviders로 QueryClientProvider를 연결한다.
7. 공통 UI 컴포넌트와 색상 토큰을 만든다.
8. domain 타입과 mock 데이터를 만든다.
9. player/travelSession/homeFilter store를 만든다.
10. 홈/Recap/보관함/마이/카메라/플레이리스트/리캡공유 placeholder 화면을 만든다.
11. 타입체크와 Expo Go 실행을 확인한다.

## 11. 검증 계획

```txt
npm run typecheck
npm run lint
npx expo start
```

초기 프로젝트 템플릿에 lint/typecheck 스크립트가 없으면 package.json에 추가한다.

## 12. 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 현재 폴더가 비어 있지 않아 create-expo-app이 실패할 수 있음 | `create-expo-app` 대신 프로젝트 파일을 수동 작성한다. 기존 기획 문서는 유지한다. |
| NativeWind 버전 설정이 Expo SDK와 충돌할 수 있음 | NativeWind를 확정 사용하되 설치 직후 smoke test를 수행한다. 실패 시 사용자에게 StyleSheet 전환 여부를 묻는다. |
| MMKV가 Expo Go에서 동작하지 않음 | 이번 범위에서 MMKV를 제외하고 후속으로 AsyncStorage 또는 custom dev client 여부를 결정한다. |
| 실제 오디오 재생 방식이 미정 | 초기에는 인앱 오디오 엔진 없이 player UI 상태와 외부 플랫폼 연동 placeholder만 둔다. |
| Claude 리뷰에서 스택 범위가 과하다고 판단할 수 있음 | 초기 설치 범위를 조정하고, 후속 작업으로 분리한다. |

## 13. Claude 리뷰 요청 포인트

Claude에게 특히 확인받고 싶은 부분은 다음과 같다.

- Expo Router + NativeWind + React Query + Zustand 조합이 RN 초심자 MVP에 과하지 않은지
- mock API 계층과 entities/features/shared 구조가 현재 규모에 적절한지
- 권한/음악/카메라 기능을 후속으로 미루는 결정이 안전한지
- 초기 세팅에서 반드시 포함해야 할 누락 항목이 있는지

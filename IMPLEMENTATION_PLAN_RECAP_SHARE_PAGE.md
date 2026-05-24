# Soundlog 리캡 공유 페이지 구현 계획

## 1. 작업 목표

현재 정적 placeholder 수준의 `recap-share/[id]` 화면을 Figma `Music log / Recap Share` 화면과 제작 문서 기준에 맞춰 실제 MVP 공유 미리보기 화면으로 개선한다. 이번 작업은 영상 리캡, Instagram Stories 직접 공유, Snapchat 딥링크까지 붙이는 단계가 아니라, 공유 가능한 리캡 카드 UI와 안정적인 저장/공유 진입 구조를 만드는 단계이다.

## 2. 사용자 목표

사용자는 Recap 리스트에서 특정 여행 음악 기록을 선택한 뒤, 공유될 결과물의 모습을 중앙 카드로 미리 보고, 저장 또는 공유 액션을 실행할 수 있어야 한다. 공유 화면에서도 Figma 기준처럼 하단 탭바가 유지되어 앱 구조의 일관성이 깨지지 않아야 한다.

## 3. 범위

### 포함

- 리캡 공유 route를 탭 그룹 내부로 이동해 하단 탭바 유지
- Recap 공유 상세 타입 추가
- mock API + TanStack Query hook 추가
- 중앙 `RecapPreviewCard` 구현
- LP/앨범 카드 형태 구현
- 관광공사 이미지 기반 카드 배경 fallback 구조
- 기록 시간 포맷팅 함수 추가
- Share action 리스트 구현
- Save/Share 중복 탭 방지 상태
- 저장/공유 기능을 위한 캡처 가능 카드 ref 구조 설계
- 로딩/에러/빈 상태
- 하단 탭바와 액션 리스트가 겹치지 않도록 safe-area padding 반영

### 조건부 포함

- `react-native-view-shot`, `expo-sharing`, `expo-media-library` 설치 및 실제 Save/Share 연결
- 단, 이 부분은 네이티브 권한과 공유 정책을 포함하므로 구현 직전 사용자 확인 후 진행한다.

### 제외

- Instagram Stories 직접 공유
- Snapchat 직접 공유
- Messages 직접 deep link
- 서버 이미지 생성
- 공유 이벤트 서버 전송
- 영상형 리캡 생성
- 리캡 템플릿 편집

## 4. 현재 상태

현재 [app/recap-share/[id].tsx](/Users/manwook-han/Desktop/hmw/code/soundlog/app/recap-share/[id].tsx)는 다음 상태다.

- `recapShare` mock을 직접 import하는 정적 화면
- route id를 사용하지 않음
- query/loading/error 상태 없음
- 루트 Stack 화면이므로 하단 탭바가 유지되지 않음
- 공유/저장 버튼은 View만 있고 실제 Pressable 동작이 없음
- 카드 배경 이미지와 LP 이미지 구조가 단순 placeholder임

현재 [app/(tabs)/recap.tsx](/Users/manwook-han/Desktop/hmw/code/soundlog/app/(tabs)/recap.tsx)는 `/recap-share/:id`로 이동한다. Expo Router의 route group은 URL path에 포함되지 않으므로, 화면 파일을 `app/(tabs)/recap-share/[id].tsx`로 옮겨도 기존 URL은 유지할 수 있다.

## 5. 구현 방향

route 파일은 얇게 유지하고, 리캡 공유 UI는 `src/components/recap-share`로 분리한다.

```txt
app/(tabs)/recap-share/[id].tsx
  RecapShareScreen

src/components/recap-share/
  RecapShareScreen.tsx
  RecapPreviewCard.tsx
  RecordDisc.tsx
  ShareActionList.tsx
  ShareActionButton.tsx
  RecapShareState.tsx

src/api/recapQueries.ts
src/api/recapApi.ts
src/mocks/recapMocks.ts
src/types/domain.ts
src/utils/dateFormat.ts
```

`app/_layout.tsx`의 루트 `recap-share/[id]` 등록은 제거하고, `app/(tabs)/_layout.tsx`에 hidden tab route로 `recap-share/[id]`를 등록한다. `(tabs)`는 이미 `headerShown: false`이므로 네이티브 헤더가 뜨지 않는다.

현재 앱은 메인 플레이리스트 상세도 같은 방식으로 hidden tab route를 사용하고 있다. 리캡 공유 페이지도 우선 동일한 라우팅 정책을 적용해 하단 탭바를 유지한다.

```tsx
<Tabs.Screen
  name="recap-share/[id]"
  options={{
    href: null,
    title: '리캡 공유',
  }}
/>
```

뒤로가기 정책은 다음처럼 가정한다.

- 화면 내 별도 back button은 Figma에 없으므로 MVP에서는 추가하지 않는다.
- 사용자는 하단 탭바로 다른 주요 화면으로 이동할 수 있다.
- OS/브라우저 back은 Expo Router history에 맡긴다.
- 사용자가 “리캡 리스트로 명확히 돌아가는 back button”을 원하면 후속으로 탭 내부 Stack 구조를 재설계한다.

## 6. 데이터 계약

### 타입 추가

```ts
type RecapShare = {
  id: string;
  placeName: string;
  trackTitle: string;
  artistName: string;
  backgroundImageUrl?: string;
  discImageUrl?: string;
  recordedAt: string; // ISO string
  shareImageUrl?: string;
};
```

`RecapShare`는 기존 `RecapItem`과 분리된 상세 공유 전용 타입이다. 기존 Recap 리스트의 `RecapItem.createdAt` 계약은 건드리지 않는다. 공유 상세 mock에서만 `recordedAt`을 ISO string으로 정리하고, 화면에서 포맷팅한다.

### Query hook

```ts
useRecapShareQuery(id?: string)
```

mock API는 다음 형태를 따른다.

```ts
recapApi.getRecapShare(id?: string): Promise<RecapShare>
```

후속 실제 API 전환 시 계약:

```txt
GET /v1/recaps/:recapId/share
```

## 7. 상태 소유권

| 상태 | 위치 | 설명 |
| --- | --- | --- |
| 리캡 상세 데이터 | TanStack Query | mock API 기반 로딩/에러/캐시 |
| 카드 capture ref | `RecapShareScreen` | Save/Share 실행 시 사용 |
| 선택 액션 | 화면 로컬 state | instagram/snapchat/messages/save/share |
| saving/sharing 상태 | 화면 로컬 state | 중복 탭 방지 |
| 저장/공유 결과 메시지 | 화면 로컬 state | MVP toast 대체 |

캡처 관련 상태는 Phase 1과 Phase 2를 분리한다.

- Phase 1: `RecapPreviewCard`는 순수 UI 컴포넌트로 두고, 캡처 ref를 직접 소유하지 않는다.
- Phase 2: 실제 저장/공유 승인 후 `RecapCaptureFrame` 래퍼를 추가해 `react-native-view-shot`의 `ViewShot` ref를 소유한다.
- 이렇게 하면 `RecapPreviewCard` 자체를 나중에 `ViewShot` root로 바꾸지 않아도 된다.

## 8. 공유/저장 정책

제작 문서 기준으로 MVP는 OS 기본 공유 시트를 우선한다.

| 액션 | MVP UI | MVP 동작 |
| --- | --- | --- |
| Instagram | 버튼 노출 | OS 공유 시트 호출 |
| Snapchat | 버튼 노출 | OS 공유 시트 호출 |
| Messages | 버튼 노출 | OS 공유 시트 호출 |
| Save | 버튼 노출 | 카드 이미지 저장 |
| Share | 버튼 노출 | OS 공유 시트 호출 |

앱별 직접 딥링크는 후속 고도화로 둔다. 앱별 버튼을 누르더라도 현재 단계에서는 “해당 앱으로 바로 보내기”가 아니라 OS 공유 시트를 여는 방식이다. 이 정책은 사용자에게 명확히 안내해야 한다.

## 9. 네이티브 라이브러리 계획

실제 Save/Share까지 구현하려면 다음 라이브러리가 필요하다.

```txt
react-native-view-shot
expo-sharing
expo-media-library
```

구현 전 확인할 점:

- Expo SDK 56 호환 버전으로 설치해야 한다.
- iOS 갤러리 저장 권한 문구가 필요할 수 있다.
- Android 저장 권한 정책은 OS 버전에 따라 다르게 동작할 수 있다.
- web export에서는 native capture/save/share가 제한될 수 있으므로 platform guard가 필요하다.

다음 구현에서는 두 단계로 나눈다.

1. UI/라우팅/query/상태 구조 구현
2. 사용자가 승인하면 native save/share 패키지 설치 및 기능 연결

## 10. UI 상세 계획

### 10.1 RecapShareScreen

- 전체 배경은 `Screen` 또는 `LinearGradient` 기반
- 상단 타이틀: `Share Your Music`
- 중앙 카드: 300x400, 작은 화면에서는 `maxWidth`와 `aspectRatio`로 대응
- 기록 시간 텍스트
- 공유 액션 리스트
- 하단 safe-area padding은 기존 [src/constants/layout.ts](/Users/manwook-han/Desktop/hmw/code/soundlog/src/constants/layout.ts)의 `getTabBarHeight(insets.bottom)`를 기준으로 확보
- 작은 화면 대응은 `width: '88%'`, `aspectRatio: 3 / 4`, `maxWidth: 320`을 우선 사용한다.

### 10.2 RecapPreviewCard

- 카드 전체는 캡처 가능한 단일 root View로 구성하되, 실제 capture ref는 Phase 2의 `RecapCaptureFrame` 래퍼에서 소유한다.
- 배경 이미지는 `expo-image` 사용
- 이미지 없음 또는 로드 실패 시 dark gradient/fallback color
- 상단 장소명 absolute
- 중앙 LP disc
- 중앙 hole
- 하단 곡 제목/아티스트 absolute
- 텍스트는 `numberOfLines`로 overflow 방지

### 10.3 RecordDisc

- 원형 View
- 관광공사 이미지 또는 `shareImageUrl`을 disc 이미지로 사용
- 중앙 hole은 dark circle
- 그림자/테두리는 과하지 않게 적용

### 10.4 ShareActionList

- horizontal `ScrollView`
- 각 버튼은 64~72px 폭
- Pressable 터치 영역 44px 이상
- 각 버튼은 `accessibilityRole="button"`과 명확한 `accessibilityLabel`을 가진다.
- `isBusy`일 때 모든 액션 disabled
- 액션 실행 중 해당 버튼 opacity 처리

앱별 직접 공유가 없는 상태에서 Instagram/Snapchat/Messages 버튼이 모두 같은 OS 공유 시트를 열면 UX가 어색할 수 있다. 따라서 구현 옵션은 두 가지로 분리한다.

| 옵션 | 설명 |
| --- | --- |
| A | Figma와 동일하게 앱별 버튼을 노출하되 모두 OS 공유 시트 호출 |
| B | MVP에서는 Save와 Share만 노출하고 앱별 버튼은 후속 직접 공유 연동 때 추가 |

기본 추천은 B안이다. 다만 Figma 충실도가 더 중요하면 A안으로 구현할 수 있다.

### 10.5 RecapShareState

- Loading: 카드 skeleton + 액션 skeleton
- Error: 재시도 버튼
- Empty: `공유할 음악 기록을 찾을 수 없어요`

## 11. 예외 상태

| 상황 | 처리 |
| --- | --- |
| recap id 없음 | fallback mock 또는 empty 상태 |
| 리캡 로딩 | 카드 skeleton |
| 리캡 실패 | 재시도 가능한 에러 화면 |
| 리캡 없음 | “공유할 음악 기록을 찾을 수 없어요” |
| 이미지 없음 | dark gradient fallback |
| 이미지 로딩 실패 | 카드 자체는 유지 |
| Save/Share 중복 탭 | `isSaving` / `isSharing`으로 disable |
| 캡처 실패 | 결과 메시지로 다시 시도 안내 |
| 공유 취소 | 실패로 표시하지 않고 조용히 종료 |
| 저장 권한 거부 | 설정 이동 안내 또는 권한 필요 메시지 |
| web 환경 | Phase 1에서는 UI만 제공, Phase 2 native 기능은 disabled 또는 안내 fallback |

Save/Share 실행 상태는 `try/finally`로 반드시 초기화한다. 특히 Android 공유 시트에서 back gesture로 복귀하는 경우에도 `isSharing`이 true로 묶이지 않게 한다.

## 12. 구현 순서

1. `RecapShare` 타입 추가 및 mock 데이터 ISO date/imageUrl 확장
2. `recapApi.getRecapShare(id?)` 응답 정리
3. `recapQueries.ts` 추가
4. `recap-share/[id]` route를 탭 그룹 내부로 이동
5. `app/_layout.tsx`, `app/(tabs)/_layout.tsx` 라우팅 보정
6. `src/components/recap-share` 컴포넌트 작성
7. 날짜 포맷팅 유틸 추가
8. Save/Share 버튼은 우선 disabled가 아닌 “준비된 액션 상태”로 UI 연결
9. 사용자가 승인한 공유 버튼 정책(A 앱별 버튼 유지 / B Save+Share만 노출)을 반영
10. 실제 native Save/Share 연결 여부를 사용자에게 확인
11. 확인 후 필요 패키지 설치 및 권한/공유 기능 연결
12. 타입체크, Expo Doctor, iOS/web export 스모크 테스트
13. `/recap-share/seoul-night` route 응답 확인

## 13. 구현 전 사용자 확인이 필요한 항목

다음 항목은 제품 동작과 권한 정책에 영향을 주므로 실제 구현 전 확인한다.

1. 이번 스프린트에서 실제 갤러리 저장/OS 공유까지 붙일지, 아니면 UI와 상태 구조까지만 구현할지
2. Instagram/Snapchat/Messages 버튼을 OS 공유 시트로 통일해도 되는지, 아니면 MVP에서는 Save/Share만 노출할지
3. 저장 권한이 거부됐을 때 앱 설정으로 보내는 CTA까지 넣을지, 간단 안내만 할지
4. 리캡 공유 화면에 별도 뒤로가기 버튼이 필요한지, 탭바 이동만으로 충분한지
5. 공유 이미지 캡처 영역은 중앙 카드만인지, 날짜 텍스트까지 포함할지

## 14. Claude 리뷰 반영 사항

Claude 리뷰에서 나온 지적은 다음처럼 반영한다.

- hidden tab route 등록 방식을 `href: null`로 명시했다.
- 현재는 플레이리스트 상세와 같은 hidden tab route 정책을 적용하고, 명확한 stack pop/back button이 필요하면 후속 재설계로 분리한다.
- `RecapShare`를 기존 `RecapItem`과 분리해 `recordedAt` ISO 변경이 Recap 리스트를 깨지 않게 했다.
- `imageUrl`/`shareImageUrl` 대신 `backgroundImageUrl`/`discImageUrl`로 역할을 명확히 했다.
- 캡처 ref는 `RecapPreviewCard` 내부가 아니라 Phase 2의 `RecapCaptureFrame` 래퍼가 소유하도록 계획을 바꿨다.
- `getTabBarHeight` 유틸의 실제 파일 경로를 명시했다.
- 공유 버튼 접근성, 작은 화면 카드 비율, Android 공유 취소 후 state 초기화, web fallback을 보강했다.

## 15. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

검증 후 `.expo-export-smoke`, `.expo-export-smoke-web`는 삭제한다.

수동 확인 항목:

- `/recap-share/seoul-night` route가 탭바를 유지하는지 확인
- 카드가 작은 화면에서 잘리지 않는지 확인
- 날짜/시간 포맷이 기획과 맞는지 확인
- Share action이 탭바와 겹치지 않는지 확인
- Save/Share 중복 탭이 막히는지 확인
- 이미지 fallback 상태에서도 카드가 깨지지 않는지 확인

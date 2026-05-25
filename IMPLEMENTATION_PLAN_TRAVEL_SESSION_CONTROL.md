# Soundlog 현재 여행 세션 제어 구현 계획

## 1. 작업 목표

Soundlog의 홈은 현재 여행과 음악 추천의 중심 화면이지만, 현재 코드에서는 `travelSessionStore`의 `session.status`가 UI와 핵심 액션에 거의 연결되어 있지 않다. 카메라 중앙 버튼도 여행 세션 상태와 무관하게 항상 카메라로 이동한다.

이번 단계에서는 **여행 시작/종료 상태를 홈과 순간 저장 플로우에 연결**해 사용자가 “지금 여행을 기록 중인지”를 명확히 알 수 있게 만든다. 이 작업은 백그라운드 위치 추적이나 서버 동기화가 아니라, 프론트 MVP에서 세션 상태와 기록 데이터의 정합성을 높이는 범위다.

## 2. 사용자 목표

- 사용자는 홈에서 현재 여행이 시작 전인지, 기록 중인지, 종료됐는지 알 수 있다.
- 사용자는 여행 모드(산책, 드라이브, 카페 투어 등)를 홈에서 명확히 선택할 수 있다.
- 사용자는 여행 시작 후 중앙 카메라 버튼으로 순간 저장을 진행한다.
- 여행 세션이 시작되지 않은 상태로 카메라에 들어오면, 앱은 여행 시작을 안내한다.
- 저장된 순간 로그에는 어느 여행 세션에서 생성됐는지 연결된다.

## 3. 범위

### 포함

- `travelSessionStore`에 `endSession`, `resetSession` 추가
- 세션 메타데이터만 AsyncStorage에 persist
- 홈에 `TravelSessionCard` 추가
- 여행 모드 선택 UI를 세션 카드에 포함
- 중앙 카메라 버튼이 idle/ended 상태에서 여행 시작 확인 후 카메라로 이동
- 카메라 화면 직접 진입 시 active session이 아니면 여행 시작 안내 화면 표시
- `MomentLog`에 `sessionId` 추가
- 순간 저장 시 현재 `session.id`를 로그에 저장

### 제외

- 백그라운드 위치 추적
- 자동 여행 종료
- 서버 세션 동기화
- 세션별 Recap 그룹핑 로직 변경
- 여행 종료 시 자동 Recap 생성
- 푸시/알림
- raw GPS 좌표 추가 영구 저장

## 4. 기능 계약

### Entry Point

- `홈 > 현재 여행 세션 카드`
- `하단 중앙 카메라 버튼`
- `/camera` 직접 진입

### Exit Point

- `여행 시작`을 누르면 session status가 `active`로 변경된다.
- `여행 종료`를 누르면 session status가 `ended`로 변경되고 `endedAt`이 기록된다.
- `새 여행 시작`을 누르면 새로운 session id로 active session이 생성된다.
- active session에서 카메라 버튼을 누르면 기존처럼 `/camera`로 이동한다.
- idle/ended session에서 카메라 버튼을 누르면 OS Alert로 여행 시작 확인 후 `/camera`로 이동한다.
- `/camera` 직접 진입 시 active session이 아니면 카메라 권한 요청 전, 여행 시작 CTA를 보여준다.

## 5. 데이터 및 저장 정책

### Travel Session

현재 `travelSessionStore`의 session 구조를 유지하되 액션을 보강한다.

```ts
type TravelSession = {
  endedAt?: string;
  id: string;
  startedAt?: string;
  status: 'idle' | 'active' | 'ended';
};
```

추가 액션:

```ts
endSession(): void;
resetSession(): void;
```

Persist 정책:

- `session`, `selectedMode`만 AsyncStorage에 저장한다.
- `currentLocation`, `currentPlace`, `locationUpdatedAt`은 persist하지 않는다.
- 이유: 세션 상태는 UX 연속성을 위해 필요하지만, raw GPS와 장소 컨텍스트는 개인정보성이 더 크므로 재실행 시 다시 조회한다.

### Moment Log

`MomentLog`에 optional `sessionId`를 추가한다.

```ts
type MomentLog = {
  sessionId?: string;
};
```

기존 로컬 로그는 `sessionId`가 없을 수 있으므로 모든 mapper/화면은 optional로 처리한다.

## 6. UI 설계

### `TravelSessionCard`

신규 파일:

```txt
src/components/home/TravelSessionCard.tsx
```

표시 정보:

- 상태 라벨
  - idle: `여행을 시작해볼까요?`
  - active: `여행 기록 중`
  - ended: `여행이 종료됐어요`
- 설명
  - idle: 현재 장소와 음악을 하나의 여정으로 묶기 위해 시작 유도
  - active: 순간 저장과 Music Log가 현재 여행에 연결됨 안내
  - ended: Recap 확인 또는 새 여행 시작 유도
- 선택 여행 모드 칩
  - 산책, 드라이브, 카페 투어, 바다 보기, 축제, 야경 감상
- CTA
  - idle: `여행 시작`
  - active: `여행 종료`
  - ended: `새 여행 시작`
- 보조 CTA
  - ended 상태에서 `Recap 보기`

홈 배치:

- `LocationContextCard` 아래
- `FeaturedPlaylistSection` 위

이유:

- 위치 컨텍스트를 확인한 다음, 이 위치를 현재 여행으로 기록할지 결정하는 흐름이 자연스럽다.

### 중앙 카메라 버튼

`app/(tabs)/_layout.tsx`의 `CameraTabButton`에서 `travelSessionStore.session.status`를 읽는다.

동작:

- active: `/camera`
- idle/ended: Alert 표시
  - title: `여행을 시작할까요?`
  - message: `순간 저장은 현재 여행에 연결돼요.`
  - cancel: `취소`
  - confirm: `시작하고 촬영`

Web에서는 Alert 동작 차이가 있으나 Expo web smoke 범위에서는 `Alert.alert`를 허용한다.

### Camera Guard

`MomentCaptureScreen` 진입 시 `session.status !== 'active'`이면 카메라 권한 요청 전에 안내 화면을 표시한다.

CTA:

- `여행 시작하고 촬영하기`
- `돌아가기`

## 7. 이벤트/추천 로그

이번 단계에서는 여행 시작/종료를 `recommendationEventStore`에 기록하지 않는다.

이유:

- 세션 시작/종료는 추천 품질 신호라기보다 제품 사용 이벤트다.
- 현재 이벤트 스토어는 추천 반응 중심으로 설계되어 있어 의미가 섞일 수 있다.

다만 순간 저장 로그에는 `sessionId`를 남겨 후속 Recap 그룹핑과 세션별 Music Log 확장에 사용할 수 있게 한다.

## 8. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 앱 재시작 | session metadata와 selectedMode만 복구 |
| 앱 재시작 후 active session이 복구됨 | 위치/장소는 홈에서 다시 조회 전까지 비어 있을 수 있음 |
| 카메라 직접 진입 + session idle | 카메라 권한 요청 전 세션 시작 안내 |
| session ended 상태에서 카메라 버튼 클릭 | 새 session 시작 확인 후 촬영 |
| 여행 모드 미선택 | 카드에서 선택 유도하되 순간 저장은 허용 |
| 기존 MomentLog에 sessionId 없음 | optional 처리 |
| 위치 권한 없음 | 세션 시작은 가능, 순간 저장은 위치 없음 상태로 기존 정책 유지 |
| 사용자가 active session에서 종료 | 현재 위치/음악 상태는 유지, session만 ended 처리 |

## 9. 구현 파일 계획

신규 파일:

```txt
src/components/home/TravelSessionCard.tsx
```

수정 파일:

```txt
src/store/travelSessionStore.ts
src/types/domain.ts
src/components/moment-capture/MomentCaptureScreen.tsx
app/(tabs)/_layout.tsx
app/(tabs)/index.tsx
```

## 10. 구현 순서

1. `travelSessionStore`에 persist, `endSession`, `resetSession` 추가
2. `MomentLog` 타입에 `sessionId` optional 추가
3. `MomentCaptureScreen` 저장 payload에 `session.id` 연결
4. `MomentCaptureScreen`에 active session guard 추가
5. `TravelSessionCard` 컴포넌트 추가
6. 홈 화면에 `TravelSessionCard` 배치
7. 중앙 카메라 버튼에 session-aware Alert 연결
8. 타입체크 및 Expo export 검증

## 11. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform android --output-dir .expo-export-smoke-android
npx expo export --platform ios --output-dir .expo-export-smoke-ios
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- 홈에서 여행 시작 CTA 클릭 시 상태가 active로 변경
- 여행 모드 칩 선택 시 세션 카드와 추천 context에 반영
- active 상태에서 중앙 카메라 버튼이 카메라로 이동
- idle/ended 상태에서 중앙 카메라 버튼이 시작 확인을 띄움
- `/camera` 직접 진입 시 active가 아니면 세션 시작 안내 표시
- 순간 저장 후 로컬 log에 `sessionId` 포함
- 앱 재시작 후 session metadata만 복구되고 위치는 재조회 필요 상태로 유지

## 12. Codex 계획 리뷰 및 반영

### 리뷰 결과

- 세션 metadata persist는 타당하지만 raw GPS/장소를 함께 저장하면 개인정보 리스크가 커진다.
- 카메라 버튼을 완전히 비활성화하면 사용자가 왜 기록을 못 하는지 모를 수 있으므로, Alert로 시작 확인 후 진행하는 편이 낫다.
- `MomentCaptureScreen`에도 guard가 필요하다. 탭 버튼 외에 직접 라우팅될 수 있기 때문이다.
- 여행 시작/종료 이벤트를 recommendation event에 섞지 않는 결정은 적절하다.
- 기존 `MomentLog`와의 호환을 위해 `sessionId`는 optional이어야 한다.

### 반영 사항

- persist 대상은 `session`, `selectedMode`로 제한한다.
- 카메라 버튼은 idle/ended에서 Alert confirm 후 `startSession()` + `/camera`로 이동한다.
- 카메라 화면 내부에도 active session guard를 둔다.
- 여행 시작/종료는 추천 이벤트로 기록하지 않는다.
- `MomentLog.sessionId`는 optional로 설계한다.

## 13. Codex 코드 리뷰 및 반영

구현 후 Codex 코드 리뷰에서 다음 이슈를 확인하고 반영했다.

- `MomentCaptureScreen`이 active session guard를 렌더링하더라도, mount 시점의 위치 조회 effect가 먼저 실행되어 세션 시작 전 위치 권한 요청 흐름을 탈 수 있었다.
- 수정: 위치 조회 effect 조건에 `session.status === 'active'`를 추가해, 여행 세션이 active일 때만 위치 조회와 권한 요청 경로가 실행되도록 변경했다.

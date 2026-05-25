# Soundlog 네이티브 권한 설정 화면 고도화 구현 계획

## 1. 작업 목표

현재 앱은 위치, 카메라, 사진 보관함 기능을 사용하지만, 마이페이지에서는 권한 상태를 실제 기기 상태와 연결해 보여주지 못한다. 다음 단계에서는 마이페이지에 네이티브 권한 상태를 확인하고, 필요한 경우 권한 요청 또는 앱 설정 이동을 제공하는 설정 기반을 구축한다.

이번 구현은 사용자 신뢰와 네이티브 앱 완성도를 높이는 MVP 범위다. 실제 음악 플랫폼 OAuth, 백그라운드 위치 추적, 알림 권한은 포함하지 않는다.

## 2. 사용자 목표

- 사용자는 현재 Soundlog가 위치, 카메라, 사진 저장 권한을 사용할 수 있는지 한눈에 확인한다.
- 권한이 꺼져 있으면 앱 안에서 다시 요청하거나 OS 설정으로 이동할 수 있다.
- 권한이 없어도 앱이 갑자기 막히지 않고, 어떤 기능이 제한되는지 이해할 수 있다.

## 3. 범위

### 포함

- 마이페이지 권한 상태 카드 추가
- 위치 권한, 카메라 권한, 사진 보관함 권한 상태 조회
- 권한 요청 버튼
- 권한 거부 또는 재요청 불가 상태에서 앱 설정 열기
- 앱이 foreground로 돌아올 때 권한 상태 재조회
- iOS/Android/Web 상태별 문구 분기
- 권한 조회 중/오류/웹 미지원 상태 처리

### 제외

- 백그라운드 위치 권한
- 알림 권한
- 음악 플랫폼 OAuth 또는 토큰 저장
- Spotify/Melon SDK 연동
- 권한 상태 서버 전송
- 권한 변경 이벤트 분석 서버 업로드
- 권한을 강제로 요구하는 온보딩 변경

## 4. 기능 계약

### Entry Point

- `마이페이지 > 위치/카메라 권한`
- 마이페이지 진입 시 권한 상태를 자동 조회하되, 권한 요청 팝업은 자동으로 띄우지 않는다.

### Exit Point

- 권한 요청 성공 시 상태 뱃지가 즉시 `허용됨`으로 갱신된다.
- 권한 요청이 거부되면 `설정에서 변경` 액션을 보여준다.
- 설정 앱에서 돌아오면 foreground 이벤트로 상태를 다시 조회한다.

### 권한 항목

| 항목 | RN/Expo API | 앱 기능 |
| --- | --- | --- |
| 위치 | `expo-location` | 장소 기반 추천, 주변 관광지 컨텍스트 |
| 카메라 | `expo-camera` | 순간 저장 촬영 |
| 사진 보관함 | `expo-media-library` | Recap 이미지 저장 |

## 5. 상태 모델

신규 타입:

```ts
type NativePermissionKind = 'camera' | 'location' | 'mediaLibrary';

type NativePermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'limited'
  | 'unavailable'
  | 'error';

type NativePermissionItem = {
  canAskAgain: boolean;
  description: string;
  kind: NativePermissionKind;
  status: NativePermissionStatus;
  title: string;
};
```

저장 정책:

- 권한 상태는 OS 상태에서 매번 읽는 값이므로 AsyncStorage에 저장하지 않는다.
- 앱 내부 상태는 hook 메모리 상태로만 유지한다.

## 6. 구현 파일 계획

신규 파일:

```txt
src/utils/nativePermissions.ts
src/hooks/useNativePermissionSettings.ts
src/components/my/PermissionStatusBadge.tsx
src/components/my/PermissionStatusRow.tsx
src/components/my/PermissionSettingsCard.tsx
```

수정 파일:

```txt
app/(tabs)/my.tsx
```

## 7. 모듈 역할

### `nativePermissions.ts`

역할:

- Expo 권한 API를 직접 감싼다.
- location/camera/mediaLibrary 권한 조회 함수 제공
- 권한 요청 함수 제공
- `Linking.openSettings()` 래퍼 제공
- Web에서는 권한 요청 대신 `unavailable`을 반환한다.
- 현재 설치된 `expo-camera@~56.0.7` 기준으로 정적 API
  `getCameraPermissionsAsync`, `requestCameraPermissionsAsync`를 사용한다.
- 위치는 `expo-location`의 `getForegroundPermissionsAsync`,
  `requestForegroundPermissionsAsync`만 사용한다. 백그라운드 위치는 이번 범위에서 제외한다.
- 사진 보관함은 `expo-media-library`의 `getPermissionsAsync(true)`,
  `requestPermissionsAsync(true)`를 사용해 Recap 이미지 저장 권한에 맞춘다.

주요 함수:

```ts
getNativePermission(kind)
requestNativePermission(kind)
openNativeSettings()
```

정규화 규칙:

- `granted === true` 또는 `status === 'granted'`이면 `granted`
- iOS 사진 권한의 `accessPrivileges === 'limited'`는 `limited`
- Android는 `limited`를 만들지 않고 `granted | denied | undetermined | unavailable | error`로 정규화
- 권한 API가 reject되거나 모듈이 지원되지 않으면 `error` 또는 `unavailable`로 변환

### `useNativePermissionSettings.ts`

역할:

- 마이페이지에서 권한 목록 상태를 관리한다.
- `refreshPermissions()`
- `requestPermission(kind)`
- `openSettings()`
- `AppState`가 active로 돌아오면 상태 재조회

상태:

- `items`
- `isLoading`
- `isRequestingKind: NativePermissionKind | null`
- `errorMessage`

AppState 정책:

- `AppState.addEventListener('change', ...)` subscription은 cleanup에서 반드시 `remove()`한다.
- `active`로 복귀할 때만 `refreshPermissions()`를 실행한다.
- 일부 Android 기기에서 active 이벤트가 연속 발생할 수 있으므로 300ms debounce 또는 `isRefreshing` 가드로 중복 조회를 막는다.
- 설정 앱 이동 직후 복귀한 경우에도 동일한 refresh 경로를 사용한다.

### `PermissionSettingsCard`

역할:

- 권한 목록 UI 렌더링
- 각 권한의 설명, 상태 뱃지, 액션 버튼 표시
- 권한별 문구:
  - 위치: `현재 장소에 맞는 음악 추천`
  - 카메라: `여행 순간 촬영`
  - 사진: `리캡 이미지 저장`

## 8. UI 정책

### 상태별 표시

| 상태 | 뱃지 | CTA |
| --- | --- | --- |
| `granted` | 허용됨 | 없음 또는 다시 확인 |
| `limited` | 제한됨 | 설정에서 변경 |
| `undetermined` | 확인 필요 | 권한 요청 |
| `denied` + `canAskAgain=true` | 꺼짐 | 다시 요청 |
| `denied` + `canAskAgain=false` | 꺼짐 | 설정 열기 |
| `unavailable` | 미지원 | 없음 |
| `error` | 확인 실패 | 다시 확인 |

### UX 원칙

- 마이페이지 진입만으로 권한 요청 팝업을 띄우지 않는다.
- 권한 요청은 사용자가 명시적으로 버튼을 눌렀을 때만 실행한다.
- 거부 상태에서는 기능 제한을 겁주듯 표현하지 않고, 어떤 기능이 영향을 받는지 짧게 설명한다.
- 권한 카드는 프로필 요약 카드 아래, 기본 메뉴 위에 배치한다.
- 개발용 추천 피드백 로그 카드는 계속 하단에 두어 프로덕션 설정 흐름과 섞이지 않게 한다.

컴포넌트 props 계약:

```ts
type PermissionStatusBadgeProps = {
  status: NativePermissionStatus;
};

type PermissionStatusRowProps = {
  isRequesting: boolean;
  item: NativePermissionItem;
  onOpenSettings: () => void;
  onRequest: (kind: NativePermissionKind) => void;
};

type PermissionSettingsCardProps = {
  errorMessage?: string;
  isLoading: boolean;
  isRequestingKind: NativePermissionKind | null;
  items: NativePermissionItem[];
  onOpenSettings: () => void;
  onRefresh: () => void;
  onRequest: (kind: NativePermissionKind) => void;
};
```

## 9. 예외 상태

| 상황 | 처리 |
| --- | --- |
| Web 환경 | 권한 항목을 `미지원`으로 표시하고 Dev Build 안내 |
| 권한 API 호출 실패 | 카드 내 오류 메시지와 `다시 확인` 버튼 제공 |
| iOS에서 `canAskAgain=false` | 권한 요청 대신 설정 앱 이동 |
| Android에서 `canAskAgain=true` | `다시 요청` CTA 유지 |
| Android에서 `canAskAgain=false` | `설정 열기` CTA 표시 |
| Android 13+ 사진 권한 정책 차이 | `expo-media-library` 응답을 `granted/denied/undetermined/unavailable/error`로 정규화 |
| 설정 앱 이동 실패 | 오류 메시지 표시 |
| AppState 이벤트 중복 | subscription cleanup + debounce 또는 in-flight guard로 중복 refresh 방지 |

## 10. 추천/분석 이벤트

이번 단계에서는 권한 상태를 추천 이벤트 로그에 저장하지 않는다.

이유:

- 권한 상태는 개인정보 및 민감 설정에 가까워 추천 품질과 직접 연결하지 않는다.
- 서버 전송 정책이 확정되기 전까지 로컬 분석 이벤트로도 남기지 않는다.

후속으로 필요하면 `permission_status_viewed`, `permission_request_result` 같은 별도 제품 분석 이벤트로 분리한다.

## 11. 구현 순서

1. 권한 타입과 정규화 유틸 추가
2. 권한 설정 hook 추가
3. 권한 상태 뱃지/행/카드 컴포넌트 추가
4. 마이페이지에 권한 카드 연결
5. iOS/Android/Web export 스모크 검증
6. Dev Build에서 실제 권한 요청 수동 확인 항목 정리

## 12. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform android --output-dir .expo-export-smoke-android
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- 마이페이지에서 권한 카드가 보이는지 확인
- 권한 요청 버튼이 자동 팝업 없이 사용자의 탭으로만 동작하는지 확인
- 거부 상태에서 설정 이동 버튼이 보이는지 확인
- 설정 앱에서 돌아왔을 때 상태가 갱신되는지 확인
- Web에서는 미지원 안내가 깨지지 않는지 확인

## 13. 후속 작업

- 실제 음악 플랫폼 연동 상태 카드 추가
- 외부 음악 앱 딥링크 재생 UX 정리
- 데이터 삭제/로그아웃/로컬 기록 초기화 액션 추가
- 권한 요청 결과를 제품 분석 이벤트로 분리 수집

## 14. Claude 리뷰 기록

Claude 리뷰 완료.

Blocking 이슈:

- `AppState` 이벤트 리스너 cleanup 누락 가능성
- `expo-camera` 권한 API 버전 명시 부족
- iOS/Android `denied + canAskAgain` CTA 분기 부족
- Android 13+ 미디어 권한 정규화 부족

반영:

- `subscription.remove()` cleanup 및 active 복귀 refresh 가드 명시
- 현재 설치 버전 `expo-camera@~56.0.7` 기준 정적 권한 API 사용 명시
- `denied + canAskAgain=true/false` 상태별 CTA 분리
- iOS limited와 Android 미디어 권한 정규화 규칙 분리
- 컴포넌트 props 계약과 카드 배치 위치 추가

구현 전 확인 질문:

- 이번 MVP는 위치 권한을 `앱 사용 중` foreground 권한으로만 다룬다. 백그라운드 위치/항상 허용은 후속 로드맵에서 별도 설계한다.
- 현재 앱은 로그인 게이트가 없으므로 비로그인/온보딩 완료 사용자 모두 마이페이지 권한 카드를 볼 수 있다.
- 실제 권한 플로우는 Expo Go보다 Dev Build 기준으로 최종 확인한다.

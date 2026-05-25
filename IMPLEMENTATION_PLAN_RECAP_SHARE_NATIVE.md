# Soundlog 리캡 공유 Phase 2 구현 계획

## 1. 작업 목표

리캡 공유 Phase 1에서 만든 `RecapPreviewCard` 미리보기 화면에 실제 카드 캡처, 기기 갤러리 저장, OS 기본 공유 시트를 연결한다. 이번 단계는 Instagram/Snapchat/Messages 직접 공유가 아니라, 안정적인 MVP 저장/공유 기능을 완성하는 작업이다.

## 2. 선행 작업

현재 `tailwind.config.js`에 NativeWind dark mode 오류 수정이 커밋되지 않은 상태다. Phase 2 구현 전에 다음 fix를 먼저 커밋/푸시한다.

- `darkMode: 'class'` 추가
- 검증: `npm run typecheck`, `npx expo export --platform web`

## 3. 사용자 목표

사용자는 `/recap-share/:id` 화면에서 중앙 리캡 카드를 확인한 뒤 다음을 수행할 수 있어야 한다.

- `Save`: 중앙 리캡 카드 이미지만 캡처해 기기 갤러리에 저장한다.
- `Share`: 중앙 리캡 카드 이미지만 캡처해 OS 기본 공유 시트로 공유한다.

상단 타이틀, 날짜 텍스트, 하단 액션 버튼, 탭바는 캡처 이미지에 포함하지 않는다.

## 4. 범위

### 포함

- `react-native-view-shot` 설치
- `expo-sharing` 설치
- `expo-media-library` 설치
- `expo-dev-client` 설치
- `eas.json` 개발/프리뷰/프로덕션 빌드 프로필 추가
- `app.json`에 media library 권한 문구 추가
- `RecapCaptureFrame` 추가
- `RecapPreviewCard`를 캡처 가능 영역으로 래핑
- Save 액션에서 카드 캡처 후 갤러리 저장
- Share 액션에서 카드 캡처 후 OS 공유 시트 호출
- 권한 요청/거부/제한 상태 처리
- 공유 가능 여부 확인
- 중복 탭 방지
- 저장/공유 성공/실패 메시지
- web 환경 fallback

### 제외

- Instagram Stories 직접 공유
- Snapchat 직접 공유
- Messages 직접 deep link
- 서버 공유 이벤트 전송
- 서버 이미지 생성
- 영상형 리캡 공유
- 공유 이미지 해상도 세부 옵션 UI

## 5. 제품 정책

### 공유 방식

MVP는 OS 기본 공유 시트만 사용한다.

앱별 직접 공유는 후속 작업으로 분리한다. 따라서 현재 UI는 `Save`, `Share` 두 버튼만 유지한다.

### 권한 거부 처리

갤러리 저장 권한이 거부되면 이번 단계에서는 앱 설정 이동 CTA까지 넣지 않고, 화면 내 메시지로 권한이 필요하다는 안내를 표시한다.

후속 작업에서 `Linking.openSettings()` CTA를 추가할 수 있다.

### 공유 취소 처리

사용자가 OS 공유 시트를 닫거나 취소한 것은 실패로 보지 않는다. 별도 에러 메시지를 띄우지 않고 조용히 종료한다.

### 개발 실행 환경

`react-native-view-shot`은 네이티브 모듈이므로 Expo Go에서 안정적으로 동작한다고 가정하지 않는다. 실제 캡처/저장/공유 기능은 **Dev Build 또는 EAS Build 전제**로 구현한다.

Expo Go 기반으로만 시연해야 한다면 Phase 2 구현은 보류하고, Phase 1의 UI 상태까지만 유지한다.

## 6. 네이티브 패키지

설치는 Expo 호환 버전을 맞추기 위해 `npx expo install`을 사용한다.

```bash
npx expo install react-native-view-shot expo-sharing expo-media-library
npx expo install expo-dev-client
```

`app.json` plugins:

```json
[
  "expo-router",
  "expo-font",
  [
    "expo-media-library",
    {
      "photosPermission": "Soundlog가 리캡 이미지를 저장하기 위해 사진 접근 권한이 필요합니다.",
      "savePhotosPermission": "Soundlog가 리캡 이미지를 사진 보관함에 저장하기 위해 권한이 필요합니다."
    }
  ]
]
```

## 7. 컴포넌트/모듈 설계

```txt
src/components/recap-share/
  RecapCaptureFrame.tsx
  RecapShareScreen.tsx
  RecapPreviewCard.tsx
  ShareActionList.tsx

src/hooks/
  useRecapShareActions.ts
```

## 7-1. EAS Build 설정

리캡 캡처, 사진 보관함 저장, OS 공유 시트는 네이티브 모듈을 사용하므로 실제 검증은 Expo Go가 아니라 Dev Build에서 진행한다.

추가 파일:

```txt
eas.json
```

로컬 확인 기준:

- 현재 작업 환경의 EAS CLI: `eas-cli/15.0.10`
- `eas.json` CLI 요구 버전: `>= 15.0.0`
- `eas init --non-interactive`는 현재 `@mannomi/soundlog` 프로젝트가 없다는 이유로 실패한다. `--force`를 붙이면 개인 Expo 계정에 신규 프로젝트가 생성될 수 있으므로, Expo 프로젝트 owner를 확인한 뒤 실행한다.

빌드 프로필:

| 프로필 | 용도 |
| --- | --- |
| development | 내부 테스트용 Dev Client 빌드 |
| preview | QA/공유용 내부 배포 빌드 |
| production | 스토어 배포 빌드 |

로컬 실행 스크립트:

```bash
npm run dev:client
npm run build:dev:ios
npm run build:dev:android
```

### RecapCaptureFrame

`react-native-view-shot`의 `ViewShot`을 감싸는 컴포넌트다.

역할:

- 캡처 대상 영역을 중앙 카드로 제한
- `capture()` 메서드를 상위 화면에 노출
- 카드 디자인은 기존 `RecapPreviewCard`를 그대로 사용

예상 인터페이스:

```ts
export type RecapCaptureFrameHandle = {
  capture: () => Promise<string | undefined>;
};
```

### useRecapShareActions

저장/공유 로직을 화면에서 분리한다.

입력:

```ts
type UseRecapShareActionsParams = {
  capture: () => Promise<string | undefined>;
  recapId?: string;
};
```

반환:

```ts
{
  activeAction?: 'save' | 'share';
  message?: string;
  save: () => Promise<void>;
  share: () => Promise<void>;
}
```

## 8. Save 플로우

1. `Save` 버튼 탭
2. 이미 `activeAction`이 있으면 무시
3. `capture()` 호출
4. URI가 없으면 실패 메시지
5. `MediaLibrary.requestPermissionsAsync()` 호출
6. 권한 허용이면 `MediaLibrary.createAssetAsync(uri)` 실행
7. 성공 메시지 노출
8. `finally`에서 `activeAction` 초기화

권한 상태 처리:

| 상태 | 처리 |
| --- | --- |
| granted | 저장 진행 |
| denied | 권한 필요 메시지 |
| undetermined | 요청 후 결과에 따라 처리 |
| limited | iOS에서는 신규 사진 저장이 가능하므로 저장 진행 |

## 9. Share 플로우

1. `Share` 버튼 탭
2. 이미 `activeAction`이 있으면 무시
3. `Sharing.isAvailableAsync()` 확인
4. web 등 공유 불가 환경이면 fallback 메시지
5. `capture()` 호출
6. URI가 없으면 실패 메시지
7. `Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Soundlog Recap 공유' })`
8. Android에서는 공유 시트가 열린 직후 resolve될 수 있으므로 `activeAction`은 capture/shareAsync 호출 보호 용도로만 사용한다.
9. 사용자가 공유 시트를 닫아도 에러로 표시하지 않음
10. 실제 reject만 실패 메시지
11. `finally`에서 `activeAction` 초기화

## 10. 플랫폼별 처리

| 플랫폼 | 처리 |
| --- | --- |
| iOS | 캡처, 저장, 공유 지원 |
| Android | 캡처, 저장, 공유 지원. 공유 취소 후 `finally` 보장 |
| Web | native 저장/공유 disabled 또는 안내 메시지 |

`Platform.OS === 'web'`에서는 Save/Share 버튼은 누를 수 있으나 “웹에서는 앱에서 저장/공유를 확인해주세요.” 메시지를 보여준다.

버튼을 완전히 숨기지 않는 이유는 web export 검증 중 화면 구조가 모바일과 크게 달라지지 않게 하기 위해서다.

## 11. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 캡처 ref 없음 | 다시 시도 메시지 |
| 캡처 URI 없음 | 다시 시도 메시지 |
| 저장 권한 거부 | 권한 필요 메시지 |
| 저장 실패 | 저장 실패 메시지 |
| 공유 기능 사용 불가 | 공유 불가 메시지 |
| 공유 취소 | 메시지 없음 |
| 공유 실패 | 공유 실패 메시지 |
| 버튼 연타 | `activeAction`이 있으면 무시 |

메시지 상태는 성공/실패를 구분한다.

```ts
type RecapShareMessage = {
  text: string;
  type: 'success' | 'error' | 'info';
};
```

## 12. 구현 순서

1. 선행 dark mode fix 커밋/푸시
2. `npx expo install react-native-view-shot expo-sharing expo-media-library`
3. `npx expo install expo-dev-client`
4. `eas.json` 개발/프리뷰/프로덕션 빌드 프로필 추가
5. `package.json`에 Dev Client/EAS build scripts 추가
6. `app.json` media library plugin 권한 문구 추가
7. `RecapCaptureFrame.tsx` 추가
8. `useRecapShareActions.ts` 추가
9. `RecapShareScreen.tsx`에서 기존 placeholder action 로직 제거
10. `RecapShareScreen.tsx`에서 `RecapCaptureFrame` ref 연결
11. `ShareActionList`에 실제 `save`, `share` callback 연결
12. web fallback 확인
13. 타입체크/Expo Doctor/export 검증
14. dev server에서 `/recap-share/seoul-night` 확인
15. 커밋/푸시

`ViewShot` 옵션:

```tsx
<ViewShot options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
```

임시 파일 정리는 Expo/OS 캐시에 맡기되, 공유 직후 파일 정리가 필요하면 후속으로 `expo-file-system` 도입을 검토한다.

## 13. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
npm run dev:client
npm run build:dev:ios
npm run build:dev:android
```

수동 확인:

- Save/Share 버튼 연타 시 중복 실행되지 않는지
- web에서 fallback 메시지가 뜨는지
- `/recap-share/seoul-night` route가 응답하는지
- iOS/Android 실기기 또는 시뮬레이터에서 캡처 영역이 중앙 카드만 포함하는지
- 저장 권한 거부 시 앱이 멈추지 않는지

## 14. 구현 전 확인 필요

이번 계획의 기본값은 다음과 같다.

- Dev Build 또는 EAS Build 전제
- OS 기본 공유 시트만 사용
- 앱별 직접 공유 제외
- Save/Share 버튼만 유지
- 저장 권한 거부 시 설정 이동 CTA 없이 메시지만 표시
- 캡처 영역은 중앙 카드만

사용자가 이 기본값에 동의하면 바로 구현할 수 있다.

## 15. Claude 리뷰 반영 사항

Claude 리뷰에서 나온 블로킹을 다음처럼 반영한다.

- `react-native-view-shot` 네이티브 모듈 특성상 Expo Go가 아니라 Dev Build/EAS Build 전제로 명시했다.
- `MediaLibrary.saveToLibraryAsync` 대신 `MediaLibrary.createAssetAsync`를 사용한다.
- Android `Sharing.shareAsync`가 공유 시트 open 시점에 resolve될 수 있음을 반영해, `activeAction`은 호출 중복 방지 용도로만 사용한다.
- iOS `limited` 권한은 신규 사진 저장 가능 상태로 보고 저장을 시도한다.
- 메시지 상태를 문자열이 아니라 `{ text, type }` 구조로 바꾼다.
- `ViewShot` 캡처 옵션은 `png`, `quality: 1`, `result: 'tmpfile'`로 명시한다.
- web 환경에서는 native 기능 안내 fallback을 노출한다.

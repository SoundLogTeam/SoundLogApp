# Soundlog 순간 저장 Phase 1 구현 계획

## 1. 작업 목표

홈 하단 중앙 카메라 버튼을 실제 `순간 저장` 기능으로 연결한다. 사용자는 여행 중 인상적인 장면을 촬영하고, 촬영 시점의 위치, 시간, 현재 재생 중인 음악, 선택된 여행 모드/무드 정보를 하나의 `Moment Log`로 저장한다.

이번 단계는 서버 업로드나 자동 Recap 생성까지 가지 않고, **기기 내 로컬 저장 기반의 MVP 순간 로그 생성**을 완성하는 것을 목표로 한다.

## 2. 선행 정리

현재 작업트리에 리캡 공유 네이티브 기능 변경분이 커밋 전으로 남아 있다.

작업 순서:

1. 리캡 공유 네이티브 변경분 커밋/푸시
2. EAS 프로젝트 owner 확인 후 필요 시 `eas init --force`
3. 순간 저장 Phase 1 구현 시작

순간 저장 기능은 카메라와 위치 네이티브 권한을 사용하므로 Expo Go가 아니라 **Dev Build/EAS Build 기준**으로 검증한다.

## 3. 사용자 목표

사용자는 앱 하단 중앙 카메라 버튼을 눌러 다음을 할 수 있어야 한다.

- 카메라 화면을 열고 사진을 촬영한다.
- 촬영 후 확인 화면에서 장소, 음악, 무드 정보를 확인한다.
- 저장 버튼을 눌러 여행 순간을 로컬 로그로 저장한다.
- 저장된 로그는 홈의 `Music Log` 또는 후속 Recap 생성 데이터로 활용된다.

## 4. 범위

### 포함

- `expo-camera` 설치 및 카메라 권한 처리
- `expo-location` 설치 및 foreground 위치 권한 처리
- `expo-file-system` 설치 및 촬영 이미지를 앱 문서 영역에 보존
- `@react-native-async-storage/async-storage` 설치 및 순간 로그 메타데이터 로컬 저장
- `app/camera/index.tsx` placeholder를 실제 카메라 플로우로 교체
- 현재 플레이어 상태(`playerStore`)와 여행 세션 상태(`travelSessionStore`)를 Moment Log에 연결
- 카메라 권한 거부/위치 권한 거부/현재 음악 없음/저장 실패 상태 처리
- web 환경 fallback
- 저장 후 홈으로 복귀하고 Music Log에 최신 로그 반영

### 제외

- 서버 업로드
- 백그라운드 위치 추적
- 사진 보관함 저장
- 사진 편집/필터
- 장소명 직접 수정 UI
- Recap 자동 생성
- 오프라인 재시도 큐의 서버 동기화
- 외부 음악 플랫폼 실제 재생 상태 연동

## 5. 제품 정책 초안

구현 전 사용자 확인이 필요한 정책이다.

| 정책 | 권장안 |
| --- | --- |
| 위치 추적 범위 | foreground-only. 카메라 진입 또는 저장 시점에만 위치를 읽는다. |
| 사진 없는 로그 저장 | Phase 1에서는 불가. 카메라 촬영 기반 기능으로 유지한다. |
| 위치 없는 로그 저장 | 가능. 단, `위치 없음` 상태로 저장하고 후속 수정 여지를 남긴다. |
| 음악 없는 로그 저장 | 가능. `음악 없음` 상태로 저장한다. 여행 순간을 잃지 않는 쪽을 우선한다. |
| 저장 실패 처리 | 화면 내 에러 메시지와 재시도 버튼을 제공한다. 조용히 실패시키지 않는다. |
| 로그인 전 로컬 저장 | 가능. 로그인/서버 연동 전에도 로컬 로그로 남긴다. |

## 6. 데이터 모델

기존 `MusicLogItem`은 표시용 타입이므로, 실제 저장용 타입을 추가한다.

```ts
export type MomentLog = {
  id: string;
  photoUri: string;
  createdAt: string;
  location?: GeoPoint;
  placeName?: string;
  track?: Track;
  travelMode?: TravelMode;
  moodTags: MoodTag[];
  source: 'camera';
  syncStatus: 'local' | 'pending' | 'synced' | 'failed';
};
```

Phase 1에서는 `syncStatus: 'local'`만 사용한다.

## 7. 네이티브 패키지

Expo 호환 버전을 맞추기 위해 `npx expo install`을 사용한다.

```bash
npx expo install expo-camera expo-location expo-file-system @react-native-async-storage/async-storage
```

`app.json` 권한 문구:

```json
{
  "plugins": [
    [
      "expo-camera",
      {
        "cameraPermission": "Soundlog가 여행 순간을 사진으로 기록하기 위해 카메라 권한이 필요합니다."
      }
    ],
    [
      "expo-location",
      {
        "locationWhenInUsePermission": "Soundlog가 사진을 촬영한 장소를 함께 기록하기 위해 위치 권한이 필요합니다."
      }
    ]
  ],
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "Soundlog가 여행 순간을 사진으로 기록하기 위해 카메라 권한이 필요합니다.",
      "NSLocationWhenInUseUsageDescription": "Soundlog가 사진을 촬영한 장소를 함께 기록하기 위해 위치 권한이 필요합니다."
    }
  }
}
```

Android 권한은 Expo config plugin이 기본 반영하되, Expo Doctor와 prebuild config 검증에서 확인한다.

Expo Camera는 최신 API 기준으로 `CameraView`와 `useCameraPermissions`를 우선 사용한다.

## 8. 화면/컴포넌트 설계

```txt
app/camera/index.tsx

src/components/moment-capture/
  MomentCaptureScreen.tsx
  CameraPermissionState.tsx
  LocationPermissionBanner.tsx
  CameraCaptureView.tsx
  MomentReviewPanel.tsx
  MomentSaveState.tsx

src/store/
  momentLogStore.ts

src/utils/
  fileUri.ts
```

### MomentCaptureScreen

카메라 플로우 전체 상태를 소유한다.

상태:

- `permissionStatus`
- `locationStatus`
- `capturedPhotoUri`
- `isCapturing`
- `isSaving`
- `errorMessage`

### CameraCaptureView

카메라 preview와 촬영 버튼만 담당한다.

역할:

- 카메라 preview 렌더링
- 촬영 버튼 처리
- 촬영 중 중복 탭 방지

### MomentReviewPanel

촬영 후 확인 화면이다.

표시 정보:

- 촬영 이미지
- 현재 장소 또는 `위치 확인 중/위치 없음`
- 현재 재생 중인 곡 또는 `음악 없음`
- 선택된 여행 모드/무드
- 저장/다시 찍기 버튼

### momentLogStore

Zustand + AsyncStorage persist로 로컬 로그를 저장한다.

역할:

- `logs: MomentLog[]`
- `addLog(log)`
- `removeLog(id)`
- `getRecentLogs(limit)`
- 홈 Music Log 표시 데이터로 변환

## 9. 플로우

### 9.1 진입

1. 사용자가 중앙 카메라 버튼 탭
2. `/camera` route 진입
3. 카메라 권한 상태 확인
4. 카메라 권한 미결정이면 요청
5. 위치 권한은 foreground로 요청하되, 거부되어도 카메라 사용은 계속 허용

### 9.2 촬영

1. 카메라 preview 표시
2. 촬영 버튼 탭
3. `takePictureAsync` 실행
4. 임시 사진 URI 수신
5. `expo-file-system`으로 앱 문서 영역에 이미지 복사
6. 리뷰 패널로 전환

### 9.3 저장

1. 저장 버튼 탭
2. 현재 위치, 현재 음악, 여행 모드, 무드 태그 스냅샷 생성
3. `MomentLog` 생성
4. `momentLogStore.addLog` 실행
5. 저장 성공 메시지 또는 홈 복귀

## 10. 기존 상태 연결

| 기존 상태 | 활용 |
| --- | --- |
| `playerStore.currentTrack` | 촬영 시점의 대표 음악 |
| `playerStore.playlistId` | 후속 추천/Recap 분석용 |
| `travelSessionStore.currentLocation` | 위치 조회 실패 시 fallback |
| `travelSessionStore.selectedMode` | 여행 모드 |
| `homeFilterStore.selectedMoodFilter` | 표시용 무드 필터를 `MoodTag[]`로 매핑 |

현재 `homeFilterStore`는 문자열 기반 `selectedMoodFilter`만 갖고 있으므로, Phase 1에서는 `전체`를 빈 배열로 두고 `신나는`, `잔잔한`, `감성적인`, `시원한 바람` 같은 표시 문구를 `MoodTag`로 매핑한다. 후속 추천 API 연결 시에는 표시 문구와 API 파라미터를 분리한다.

## 11. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 카메라 권한 거부 | 권한 필요 화면 + 설정으로 이동 CTA |
| 위치 권한 거부 | 위치 없이 저장 가능, 배너로 안내 |
| 위치 조회 타임아웃 | 마지막 위치 fallback, 없으면 위치 없음 |
| 현재 음악 없음 | 음악 없음으로 저장 가능 |
| 촬영 실패 | 재시도 메시지 |
| 이미지 복사 실패 | 저장 실패 메시지, 다시 촬영 유도 |
| 저장 중 앱 이탈 | 이미 복사된 파일은 후속 정리 대상 |
| 저장 버튼 연타 | `isSaving`으로 중복 방지 |
| AsyncStorage 실패 | 화면 내 실패 메시지 + 재시도 |
| Web 진입 | 카메라 미지원 안내와 돌아가기 CTA |

위치 조회는 `Location.getCurrentPositionAsync`에 직접 timeout 옵션을 기대하지 않고, `Promise.race` 기반 앱 레벨 타임아웃을 둔다.

## 12. 구현 순서

1. 현재 리캡 네이티브 공유 변경분 커밋/푸시
2. 필요한 네이티브 패키지 설치
3. `app.json` 카메라/위치 권한 문구 추가
4. `MomentLog` 타입 추가
5. `momentLogStore` 추가
6. `app/camera/index.tsx`를 `MomentCaptureScreen`으로 연결
7. 카메라 권한 상태 UI 구현
8. 카메라 preview 및 촬영 구현
9. 위치 조회 및 fallback 구현
10. 촬영 후 리뷰 패널 구현
11. 이미지 파일 보존 및 로컬 로그 저장 구현
12. 홈 Music Log가 로컬 로그를 우선 반영하도록 연결
13. 타입체크/Expo Doctor/export 검증
14. Dev Build에서 카메라/저장 수동 테스트

## 13. 검증 계획

자동 검증:

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 검증:

- Dev Build에서 `/camera` 진입
- 카메라 권한 허용 후 preview 표시
- 카메라 권한 거부 시 설정 이동 CTA 표시
- 위치 권한 거부 상태에서도 촬영/저장 가능
- Web에서 `/camera` 진입 시 fallback 화면 표시
- 현재 음악이 없을 때도 저장 가능
- 저장 후 홈 Music Log에 최신 로그 반영
- 앱 재시작 후 로컬 로그 유지

## 14. Claude 리뷰 기록

`claude_review_plan.sh IMPLEMENTATION_PLAN_MOMENT_CAPTURE.md`를 90초 timeout으로 실행했으나 Claude CLI가 출력 없이 종료되어 리뷰를 받지 못했다. 구현 전 재시도하거나, CLI 상태가 계속 불안정하면 자체 체크리스트로 대체한다.

## 15. 구현 전 확인 질문

1. 위치는 foreground-only로 갈까요, 아니면 후속 백그라운드 위치까지 염두에 두고 권한 설계를 열어둘까요?
2. 사진 없는 순간 로그는 Phase 1에서 막을까요, 아니면 `사진 없이 저장` 버튼을 둘까요?
3. 위치 또는 음악이 없을 때도 로그 저장을 허용하는 권장안으로 진행해도 될까요?
4. 로그인 전 로컬 저장을 허용하고, 나중에 서버 동기화하는 방향으로 갈까요?

# iPhone 실기기 테스트 가이드

Soundlog를 실제 iPhone에 설치해 카메라, 위치, 지도, 사진 보관함, API 연동을 검수하는 방법을 정리합니다.

## 1. 권장 테스트 방식

개발 중인 최신 코드를 본인 iPhone에서 확인할 때는 **USB 연결 로컬 development build**를 우선 사용합니다.

| 방식                       | 용도                           | Apple Developer Program  | 개발자 모드 |
| -------------------------- | ------------------------------ | ------------------------ | ----------- |
| USB 로컬 development build | 본인 기기에서 최신 코드 디버깅 | 무료 Apple 계정으로 가능 | 필요        |
| EAS 내부 배포              | 등록한 기기에 QR 링크로 설치   | 유료 멤버십 필요         | 필요        |
| TestFlight                 | 팀원·지인에게 배포             | 유료 멤버십 필요         | 불필요      |

Soundlog는 `expo-camera`, `expo-location`, `expo-media-library`, `react-native-maps` 등 네이티브 모듈을 사용하므로 실제 기능 검수는 Expo Go보다 development build가 적합합니다.

공식 참고 자료:

- [Expo iOS 실기기 development build](https://docs.expo.dev/get-started/set-up-your-environment/?device=physical&mode=development-build&platform=ios)
- [Expo 로컬 네이티브 빌드](https://docs.expo.dev/guides/local-app-development/)
- [Apple 개발자 모드 활성화](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device)
- [Apple Xcode 지원 버전](https://developer.apple.com/support/xcode/)

## 2. 현재 프로젝트 준비 상태

프로젝트에는 실기기 development build에 필요한 설정이 이미 있습니다.

- iOS bundle identifier: `com.mannomi.soundlog`
- URL scheme: `soundlog`
- EAS project ID 설정 완료
- `expo-dev-client` 설치 완료
- `development`, `preview`, `production` EAS profile 구성 완료
- HTTP 로컬 API 사용 시 `app.config.js`가 해당 호스트의 ATS 예외를 개발 빌드에 추가

### 2026-07-23 점검 상태

- 감지된 기기: iPhone 15 Pro, iOS 26.5
- 기기 상태: `unavailable`
- 설치된 Xcode: 26.3, iOS 26.2 SDK
- 권장 Xcode: iOS 26.5를 지원하는 Xcode 26.6 이상
- `soundlog.shop`: 점검 당시 DNS `SERVFAIL`

위 상태는 시간이 지나면 달라질 수 있으므로 아래 명령으로 다시 확인합니다.

```bash
xcodebuild -version
xcrun devicectl list devices
xcrun xctrace list devices
```

## 3. iPhone과 Mac 준비

1. Xcode를 iPhone OS와 호환되는 최신 버전으로 업데이트합니다.
2. iPhone을 USB로 Mac에 연결하고 잠금을 해제합니다.
3. iPhone에서 `이 컴퓨터를 신뢰`를 승인합니다.
4. Xcode의 `Window > Devices and Simulators`에서 기기가 연결된 상태인지 확인합니다.
5. iPhone의 `설정 > 개인정보 보호 및 보안 > 개발자 모드`를 켭니다.
6. iPhone을 재시작한 뒤 개발자 모드 활성화를 다시 승인합니다.

정상 연결되면 다음 명령의 상태가 `available`이어야 합니다.

```bash
xcrun devicectl list devices
```

## 4. 로컬 API와 연결

### `127.0.0.1`을 사용하면 안 되는 이유

iPhone에서 `127.0.0.1`은 Mac이 아니라 **iPhone 자신**입니다. 로컬 서버를 직접 테스트하려고 아래 값을 임시로 사용하면 실기기에서는 서버에 도달하지 못합니다.

```env
EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=http://127.0.0.1:4000
```

Mac과 iPhone을 같은 Wi-Fi에 연결하고 Mac의 LAN IP를 확인합니다.

```bash
ipconfig getifaddr en0
```

예를 들어 결과가 `172.30.1.99`라면 실기기용 API 주소는 다음과 같습니다.

```text
http://172.30.1.99:4000
```

Expo SDK 56 개발 실행에서는 `.env.local`이 셸에 입력한 같은 이름의 환경변수보다 우선합니다. 로컬 서버를 테스트할 때는 `.env.local`의 API와 업로드 주소를 Mac의 LAN 주소로 임시 변경해야 합니다. 테스트가 끝나면 두 값을 `https://api.soundlog.p-e.kr`로 복구합니다.

### 서버 실행 및 확인

DB와 서버 환경변수를 준비한 뒤 API를 실행합니다.

```bash
cd /Users/manwook-han/Desktop/hmw/code/apps/soundlog/SoundLogServer
npm run dev
```

Mac에서 LAN 주소로 헬스 체크가 되는지 확인합니다.

```bash
curl http://<MAC_LAN_IP>:4000/v1/health
```

iPhone Safari에서도 같은 헬스 체크 URL을 열 수 있어야 합니다. 열리지 않으면 다음을 확인합니다.

- Mac과 iPhone이 같은 네트워크인지
- macOS 방화벽이 Node.js 또는 포트 4000을 차단하는지
- 서버가 포트 4000에서 실행 중인지
- 공유기에서 기기 간 통신을 차단하는 게스트 Wi-Fi인지

## 5. iPhone에 앱 설치

앱 디렉터리의 `.env.local`에 Mac의 LAN IP를 임시로 설정합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=http://<MAC_LAN_IP>:4000
EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN=http://<MAC_LAN_IP>:4000
```

그다음 개발 빌드를 설치합니다.

```bash
cd /Users/manwook-han/Desktop/hmw/code/apps/soundlog/soundlog
npx expo run:ios --device
```

명령에서 기기 선택 화면이 나오면 연결한 iPhone을 선택합니다. 처음 실행할 때 Xcode 코드 서명용 Apple 계정 또는 Team 선택이 필요할 수 있습니다.

앱이 한 번 설치된 뒤 JavaScript 코드만 수정할 때는 네이티브 재빌드 없이 Metro를 다시 연결할 수 있습니다.

```bash
npx expo start --dev-client --lan
```

LAN 연결이 불안정하면 Metro에만 `--tunnel`을 사용할 수 있습니다. 이 경우에도 로컬 API는 별도로 iPhone에서 접근 가능한 주소여야 합니다.

## 6. 배포 API로 테스트

배포 API가 정상일 때는 다음 주소를 사용합니다.

```text
https://api.soundlog.p-e.kr
```

앱 실행 전에 먼저 상태를 확인합니다.

```bash
curl https://api.soundlog.p-e.kr/v1/health
```

DNS 오류나 타임아웃이 발생하면 배포 API 테스트를 중단하고 로컬 LAN API를 사용하거나 운영 API 상태를 먼저 복구합니다. 도메인 장애 중에 서버 IP를 앱에 임시 하드코딩하지 않습니다.

## 7. EAS 내부 배포

USB 없이 등록된 iPhone에 설치 링크를 전달하려면 EAS 내부 배포를 사용합니다. 활성 Apple Developer Program 멤버십이 필요합니다.

```bash
cd /Users/manwook-han/Desktop/hmw/code/apps/soundlog/soundlog
npx eas-cli login
npx eas-cli device:create
npm run build:dev:ios
```

빌드가 완료되면 표시되는 링크나 QR 코드로 iPhone에 설치합니다. 현재 `development` profile은 `https://api.soundlog.p-e.kr`을 직접 사용하므로 도메인 상태가 정상이어야 전체 기능을 테스트할 수 있습니다.

설치 후 로컬 코드를 연결하려면 다음을 실행합니다.

```bash
npm run dev:client
```

## 8. TestFlight 배포

다른 사람에게 설치를 요청하거나 개발자 모드 없이 테스트하려면 TestFlight를 사용합니다.

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

TestFlight 빌드는 App Store Connect 처리와 내부 또는 외부 테스터 초대가 필요합니다. 외부 테스터는 Apple의 베타 앱 심사를 거칠 수 있습니다.

v1.0은 iPhone 전용으로 제출한다. iPad 스크린샷 자산과 iPad 실기기 QA가 완료되지 않았으므로 `ios.supportsTablet`은 `false`로 유지한다.

스크린샷 모드에서는 AppProviders가 인증·온보딩 hydration 이후 seed를 한 번 자동 적용하고 홈으로 이동하므로 Test Manager 버튼을 누를 필요가 없다.

### 출시 권한 및 개인정보 선언

production 설정은 사진 기록에 필요한 카메라와 사진 보관함, 현재 장소와 여행 기록에 필요한 `When In Use` 위치 권한만 직접 요청한다. 녹음, 항상 위치, 모션 활동, iOS와 Android의 백그라운드 위치 권한은 앱 기능에서 사용하지 않는다. 다만 ExpoLocation 바이너리가 CoreMotion API를 포함하므로 Apple 업로드 검사를 통과하기 위한 `NSMotionUsageDescription` 문구는 `Info.plist`에 유지한다. 이 문구만으로 사용자에게 모션 권한을 요청하지는 않는다.

`ios.privacyManifests`에는 계정 이름·이메일·사용자 ID, 정확한 위치, 사진 또는 비디오, 사용자 콘텐츠를 앱 기능 목적으로 선언하고, 추천·저장·공유 등 앱 내 상호작용은 분석 목적으로 선언한다. 모든 선언은 계정과 연결되지만 추적에는 사용하지 않는다. App Store Connect의 App Privacy 응답도 이 설정 및 실제 서버 처리와 동일하게 입력한다.

제출 전 다음 검사를 실행한다.

```bash
npx expo config --type introspect --json
npm run check:store-release
```

## 9. 실기기 검수 체크리스트

### 설치와 인증

- 앱이 개발자 모드 오류 없이 실행되는가
- 회원가입과 로그인이 실제 서버와 연결되는가
- 앱 재실행 후 인증 상태가 유지되는가

### 위치와 지도

- 위치 권한 요청 문구가 정상인가
- 허용, 한 번 허용, 거부 상태를 모두 처리하는가
- 현재 위치와 주변 관광지가 정상 표시되는가
- 지도 핀과 클러스터링이 확대·축소에 맞게 동작하는가

### 카메라와 Recap

- 카메라 권한과 촬영이 정상인가
- 사진 보관함 선택과 저장이 정상인가
- 촬영한 사진, 장소, 시간, 음악이 Recap에 반영되는가
- 두 번째 온보딩 이미지 외곽 테두리가 보이지 않는가

### 음악과 플레이리스트

- 플레이리스트 선택 시 대표곡이 현재 곡으로 지정되는가
- 상세에서 곡을 선택하면 활성 행과 미니 플레이어가 함께 변경되는가
- 저장곡 행을 누르면 삭제 버튼 애니메이션이 정상 표시되는가

### 네트워크

- Wi-Fi에서 API 요청이 정상인가
- 네트워크 단절 시 오류와 재시도 UI가 표시되는가
- 앱 화면에 `127.0.0.1`, 좌표, 원시 서버 오류가 노출되지 않는가

## 10. 자주 발생하는 문제

### 기기가 `unavailable`로 표시됨

- USB를 다시 연결합니다.
- iPhone 잠금을 해제하고 Mac 신뢰를 승인합니다.
- Xcode와 iPhone OS 버전 호환성을 확인합니다.
- Xcode `Devices and Simulators`에서 기존 페어링을 해제하고 다시 연결합니다.

### 개발자 모드 항목이 없음

Xcode에서 기기 페어링을 먼저 시작한 뒤 iPhone의 `설정 > 개인정보 보호 및 보안`을 다시 확인합니다.

### 앱은 열리지만 API가 모두 실패함

- 실기기에서 `127.0.0.1`을 사용하고 있지 않은지 확인합니다.
- iPhone Safari에서 API 헬스 체크 URL을 엽니다.
- Metro를 시작할 때와 네이티브 앱을 빌드할 때 같은 API 환경변수를 사용합니다.
- `api.soundlog.shop` 사용 시 GCP Cloud DNS, 인증서와 GCP API 상태를 확인합니다.

### Metro에 연결되지 않음

- Mac과 iPhone을 같은 Wi-Fi에 연결합니다.
- VPN과 게스트 Wi-Fi를 끕니다.
- `npx expo start --dev-client --lan`을 다시 실행합니다.
- LAN 검색이 차단되면 `--tunnel`을 사용합니다.

# Soundlog 앱 빌드와 TestFlight 배포

이 문서는 Soundlog 모바일 앱을 CLI로 검증하고 iOS 빌드를 만든 뒤 TestFlight까지 업로드하는 절차를 설명합니다. 대상 저장소는 `SoundLogApp`이며 서버 배포는 이 절차에 포함하지 않습니다.

## 담당 범위

앱 담당자는 다음 작업만 수행합니다.

- 앱 코드와 `app.config.js` 및 `eas.json` 검증
- iOS Simulator 실행과 주요 화면 검수
- 로컬 IPA 또는 EAS 클라우드 빌드 생성
- 완성된 IPA를 App Store Connect에 업로드
- EAS와 TestFlight 처리 상태 확인

다음 작업은 서버 팀원에게 일임합니다.

- `SoundLogServer`와 `soundlog-ml` 코드 변경
- 운영 서버 SSH 접속과 Docker 배포
- 서버 환경변수와 GitHub Actions 시크릿 변경
- DB migration과 seed 실행
- 도메인과 DNS와 인증서와 방화벽 변경

앱 배포 중 서버 문제가 발견되면 실패한 공개 API 주소와 응답 상태만 서버 팀원에게 전달합니다. 앱 담당자가 서버를 직접 수정하거나 배포하지 않습니다.

## 현재 앱 식별 정보

| 항목 | 값 |
| --- | --- |
| Expo 프로젝트 | `@mannomi/soundlog` |
| EAS Project ID | `4b07627b-36bf-463d-a15e-b4839022ecbb` |
| iOS Bundle ID | `com.mannomi.soundlog` |
| App Store Connect App ID | `6797038341` |
| 운영 API | `https://api.soundlog.p-e.kr` |
| 앱 버전 관리 | EAS remote version |
| production 빌드 번호 | EAS가 자동 증가 |

`eas.json`의 production profile은 API와 업로드 주소를 `https://api.soundlog.p-e.kr`로 고정합니다. production 빌드에서 HTTP API를 사용하면 `app.config.js` 검증이 실패해야 합니다.

## 1. 사전 준비

macOS에 Xcode와 Node.js와 CocoaPods가 설치되어 있어야 합니다. Expo 계정과 Apple Developer Program 권한도 필요합니다.

```bash
cd /Users/manwook-han/Desktop/hmw/code/apps/soundlog/soundlog

pwd
git rev-parse --show-toplevel
git remote get-url origin
node --version
npm --version
xcodebuild -version
pod --version
eas --version
eas whoami
```

원격 저장소가 `SoundLogTeam/SoundLogApp`이 아니면 배포를 중단합니다. 서버 저장소에서는 이 문서의 명령을 실행하지 않습니다.

EAS CLI가 없거나 오래된 경우 공식 npm 패키지로 설치합니다.

```bash
npm install -g eas-cli@latest
eas --version
```

## 2. 작업 상태와 디스크 확인

빌드에 넣을 커밋과 로컬 변경을 먼저 확인합니다.

```bash
git status --short --branch
git log -1 --oneline
df -h /
```

출시 코드가 커밋되지 않았거나 어떤 파일이 빌드에 포함되는지 불분명하면 빌드를 시작하지 않습니다. 사용자 작업이 남아 있는 저장소를 강제로 초기화하거나 정리하지 않습니다.

로컬 네이티브 빌드는 Xcode 파생 데이터까지 생성하므로 10GB 이상의 여유 공간을 권장합니다. EAS 업로드 중 `No space left on device`가 발생하면 소스 파일을 삭제하지 말고 재생성 가능한 Xcode DerivedData와 npm 다운로드 캐시만 정리합니다.

```bash
derived_data_dir=/Users/manwook-han/Library/Developer/Xcode/DerivedData
npm_cache_dir=/Users/manwook-han/.npm/_cacache

find "$derived_data_dir" -mindepth 1 -depth -delete
find "$npm_cache_dir" -mindepth 1 -depth -delete
df -h /
```

위 삭제는 진행 중인 Xcode와 Metro를 종료한 뒤 실행합니다. Simulator 기기 데이터와 앱 소스는 삭제하지 않습니다.

`.easignore`는 `node_modules`, 생성된 네이티브 폴더, 로컬 환경변수, QA 캡처와 문서를 EAS 입력에서 제외합니다. `EAS_NO_VCS=1`은 의도하지 않은 파일까지 업로드할 수 있으므로 일반 배포에서 사용하지 않습니다.

## 3. 의존성과 출시 설정 검증

잠금 파일 기준으로 의존성을 설치하고 전체 앱 검사를 실행합니다.

```bash
npm ci
npm run typecheck
npm test
npm run check:store-release
npm run check:image-components
npm run check:recap-clustering
npm run check:server-contract
npm run doctor
```

운영 API를 읽기 전용으로 확인할 때는 다음 명령을 사용합니다.

```bash
npm run check:store-release:live
```

이 검사가 실패하면 앱 배포와 서버 배포를 구분해 판단합니다. 앱 설정 오류는 앱에서 수정합니다. 법적 페이지와 OpenAPI와 moderation API와 공개 seed 문제는 서버 팀원에게 전달합니다. 앱 담당자는 실패를 해결하려고 서버에 접속하거나 서버 배포를 실행하지 않습니다.

production profile이 실제로 어떤 설정을 생성하는지 확인합니다.

```bash
EAS_BUILD_PROFILE=production npx expo config --type public --json > /tmp/soundlog-production-config.json
jq '{name, version, ios, extra}' /tmp/soundlog-production-config.json
```

출력이나 문서에 비밀값을 복사하지 않습니다. `EXPO_PUBLIC_` 값은 앱 번들에 포함되는 공개 설정이므로 비밀키를 넣으면 안 됩니다.

## 4. iOS Simulator 로컬 빌드와 검수

Soundlog 제품 검수는 브라우저가 아니라 iOS Simulator에서 수행합니다.

사용 가능한 Simulator를 확인합니다.

```bash
xcrun simctl list devices available
```

기본 개발 빌드를 설치하고 Metro를 실행합니다.

```bash
npx expo run:ios --device "iPhone 16 Pro"
```

한 번 설치한 뒤 JavaScript 코드만 다시 확인할 때는 다음 명령을 사용합니다.

```bash
npx expo start --dev-client
```

최소한 다음 흐름을 Simulator에서 확인합니다.

- 첫 실행 온보딩과 로그인 진입
- 로그인 전에 필수 이용약관과 개인정보 처리방침 동의 노출
- 실제 운영 API 로그인과 세션 유지
- 지도와 현재 위치와 관광지 마커 상세 정보
- 장소 기반 음악 추천과 추천 곡 목록
- 곡 선택과 좋아요와 저장과 미니 플레이어
- 공개 로그와 내 로그 전환
- 공개 콘텐츠 신고와 사용자 차단 진입점
- 마이 페이지와 로그아웃

API health check와 단위 테스트는 보조 증거입니다. Simulator에서 화면과 인터랙션을 확인하지 않았다면 앱 검수가 끝난 것이 아닙니다.

## 5. EAS 클라우드 production 빌드

일반적인 TestFlight 배포에는 EAS 클라우드 빌드를 권장합니다. Mac에서 Xcode 아카이브를 오래 유지할 필요가 없고 EAS에 저장된 서명 자격 증명을 그대로 사용할 수 있습니다.

빌드만 생성하고 완료까지 기다립니다.

```bash
eas build \
  --platform ios \
  --profile production \
  --non-interactive \
  --wait
```

빌드와 TestFlight 업로드를 한 번에 예약하려면 다음 명령을 사용합니다.

```bash
eas build \
  --platform ios \
  --profile production \
  --auto-submit \
  --non-interactive \
  --wait
```

터미널을 점유하지 않고 시작하려면 `--wait` 대신 `--no-wait`을 사용합니다. 출력된 Build ID와 Submission ID를 반드시 기록합니다.

```bash
eas build \
  --platform ios \
  --profile production \
  --auto-submit \
  --non-interactive \
  --no-wait
```

`eas.json`의 `appVersionSource`가 `remote`이고 production에 `autoIncrement`가 설정되어 있으므로 빌드 번호는 EAS에서 자동 증가합니다. 실패한 업로드 시도도 번호를 소비할 수 있습니다. 번호가 건너뛰어도 같은 번호를 재사용하려고 임의로 되돌리지 않습니다.

## 6. Mac에서 production IPA 로컬 빌드

EAS 빌드 머신 대신 현재 Mac에서 production IPA를 만들 때 `--local`을 사용합니다. 로컬 빌드는 macOS와 Xcode와 CocoaPods와 Fastlane 상태에 영향을 받으므로 클라우드 빌드가 불가능하거나 로컬 아카이브가 필요한 경우에만 사용합니다.

출력 디렉터리를 준비합니다.

```bash
mkdir -p artifacts/builds
```

production IPA를 로컬에서 생성합니다.

```bash
eas build \
  --platform ios \
  --profile production \
  --local \
  --non-interactive \
  --output ./artifacts/builds/soundlog-production.ipa
```

빌드가 끝나면 파일 형식과 크기를 확인합니다.

```bash
file ./artifacts/builds/soundlog-production.ipa
du -h ./artifacts/builds/soundlog-production.ipa
```

로컬 IPA는 저장소에 커밋하지 않습니다. `.easignore`와 Git ignore 정책을 유지하고 외부로 전달할 때는 승인된 배포 경로만 사용합니다.

## 7. 완성된 IPA를 TestFlight에 업로드

EAS 클라우드 빌드가 끝났지만 자동 제출하지 않았다면 Build ID로 업로드합니다.

```bash
eas submit \
  --platform ios \
  --profile production \
  --id <EAS_BUILD_ID> \
  --non-interactive \
  --wait
```

로컬에서 만든 IPA는 파일 경로로 업로드합니다.

```bash
eas submit \
  --platform ios \
  --profile production \
  --path ./artifacts/builds/soundlog-production.ipa \
  --non-interactive \
  --wait
```

EAS credentials service에 App Store Connect API Key가 연결되어 있으면 그 키를 사용합니다. API Key 파일이나 issuer와 private key 값을 저장소와 PR과 문서에 기록하지 않습니다.

## 8. 빌드와 제출 상태 확인

최근 iOS 빌드를 확인합니다.

```bash
eas build:list --platform ios --limit 5 --non-interactive --json
```

특정 빌드를 확인합니다.

```bash
eas build:view <EAS_BUILD_ID> --json
```

최근 제출을 확인합니다.

```bash
eas submit:list --platform ios --limit 5 --json
```

특정 제출을 확인합니다.

```bash
eas submit:view <EAS_SUBMISSION_ID> --json
```

App Store Connect와 TestFlight에서 실제로 인식한 빌드를 조회합니다.

```bash
eas submit:status --platform ios --json --non-interactive
```

상태는 다음처럼 구분합니다.

| 상태 | 의미 |
| --- | --- |
| Build `NEW` 또는 `IN_PROGRESS` | EAS가 빌드를 준비하거나 컴파일하는 중 |
| Build `FINISHED` | 서명된 IPA 생성 완료 |
| Submit `IN_QUEUE` | EAS가 Apple 업로드 작업을 기다리는 중 |
| Submit `IN_PROGRESS` | EAS가 App Store Connect에 업로드 중 |
| Submit `FINISHED` | Apple로 바이너리 전달 완료 |
| TestFlight `PROCESSING` | Apple이 바이너리를 처리하는 중 |
| TestFlight `VALID` | TestFlight에서 사용할 수 있는 빌드 |

Build가 `FINISHED`여도 TestFlight 배포가 끝난 것은 아닙니다. Submit이 `FINISHED`이고 `eas submit:status`에서 새 빌드가 보여야 업로드가 완료된 것입니다.

## 9. 제출 대기열과 중복 업로드 방지

`--auto-submit`으로 생성한 제출이 `IN_QUEUE`에 오래 머물러도 오류가 없다면 같은 Build ID를 다시 제출하지 않습니다. 중복 제출은 Apple 처리 오류와 운영 혼선을 만들 수 있습니다.

다음 순서로 확인합니다.

```bash
eas submit:view <EAS_SUBMISSION_ID> --json
eas submit:list --platform ios --limit 5 --json
eas submit:status --platform ios --json --non-interactive
```

EAS 서비스 상태도 확인할 수 있습니다.

- [Expo 서비스 상태](https://status.expo.dev/)
- [EAS Build 대기열](https://expo.dev/eas-build-status)

제출 상태가 `ERRORED`일 때만 로그를 읽고 원인을 수정한 뒤 재시도합니다. 대기 중인 제출을 취소하거나 새 제출을 만드는 것은 마지막 수단입니다.

## 10. 자주 발생하는 실패

### `No space left on device`

프로젝트 압축용 임시 Git clone이나 Xcode DerivedData를 만들 공간이 부족한 상태입니다. `df -h /`로 확인하고 2장의 정리 절차를 따릅니다. 소스와 Simulator 데이터를 삭제하지 않습니다.

### EAS가 로컬 Git clone을 만들지 못함

다음 명령으로 로컬 저장소를 얕게 복제할 수 있는지 확인합니다.

```bash
clone_test_dir=$(mktemp -d /tmp/soundlog-eas-clone.XXXXXX)
git clone --no-checkout --no-hardlinks --depth 1 "file://$(pwd)" "$clone_test_dir/repo"
git -C "$clone_test_dir/repo" rev-parse --short HEAD
find "$clone_test_dir" -mindepth 1 -depth -delete
rmdir "$clone_test_dir"
```

임시 디렉터리는 `mktemp`가 만든 정확한 경로만 삭제합니다. 저장소 루트나 홈 디렉터리를 재귀 삭제 대상으로 사용하지 않습니다.

### CocoaPods 버전 불일치

Expo patch 버전을 올린 뒤 Pod lock과 로컬 podspec이 어긋날 수 있습니다.

```bash
cd ios
pod install --repo-update
```

특정 Pod만 갱신하면 연쇄 의존성이 다시 충돌할 수 있습니다. Expo 네이티브 모듈이 여러 개 함께 바뀌었다면 전체 Pod 정합성을 확인합니다. `ios` 폴더는 생성 산출물이므로 production 설정의 기준은 `app.config.js`와 package lock입니다.

### custom Metro 설정 경고

EAS가 `metro.config.js`가 `@expo/metro-config`를 확장하지 않는다고 경고하면 실제 파일을 확인합니다. 자산 누락 가능성이 있으므로 경고를 무시한 채 TestFlight를 배포하지 않습니다. 현재 프로젝트는 Expo 설정을 확장해야 합니다.

### Apple 처리 지연

Submit이 끝나도 TestFlight에 나타나기까지 시간이 걸릴 수 있습니다. `eas submit:status`와 App Store Connect에서 처리 상태를 확인합니다. Apple 처리 중에는 같은 바이너리를 다시 업로드하지 않습니다.

## 11. 배포 완료 기준

다음 조건을 모두 만족해야 앱 TestFlight 배포가 완료된 것입니다.

- 출시 대상 커밋이 원격 브랜치에 존재한다.
- 자동 검사와 iOS Simulator 검수가 통과했다.
- EAS Build가 `FINISHED`다.
- EAS Submit이 `FINISHED`다.
- `eas submit:status` 또는 App Store Connect에서 새 빌드 번호가 확인된다.
- 새 빌드가 TestFlight 내부 테스터에게 제공 가능한 상태다.

TestFlight 업로드는 App Store 심사 제출과 다릅니다. 새 빌드를 App Store 버전에 선택하고 심사 답변과 스크린샷과 심사 정보를 제출하는 작업은 별도 승인과 별도 검수가 필요합니다.

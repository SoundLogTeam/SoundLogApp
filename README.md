# Soundlog App

Soundlog는 관광지의 위치와 맥락을 음악 추천, 여행 기록, Recap 콘텐츠로 연결하는 React Native/Expo 앱입니다.

## 빠른 시작

```bash
npm install
npm run web
```

웹 실행 후 브라우저에서 `http://localhost:8081`을 열어 확인합니다. 네이티브 기능까지 확인할 때는 Expo Go 또는 development build를 사용합니다.

```bash
npm run ios
npm run android
npm run dev:client
```

## 자주 쓰는 명령어

```bash
npm run typecheck
npm run check:recap-clustering
npm run check:server-contract
npm run check
npm run web:clear
```

`check:recap-clustering`은 전체 리캡과 내 리캡 지도의 좌표 묶음, 줌별 반경, 확대 시 개별 핀 분리를 검증합니다. `check`에도 포함되어 있습니다.

`check:server-contract`은 형제 경로의 `SoundLogServer/openapi/soundlog-api.yaml`과 프론트 `src/api`의 HTTP 메서드·경로를 비교합니다. 서버 저장소 위치가 다르면 `SOUNDLOG_SERVER_ROOT`를 지정합니다.

레거시 mock API 상태를 확인하던 지연/실패 환경변수는 `src/mock-server` 참고용으로만 남아 있습니다. 현재 앱 API facade는 서버 API만 호출합니다.

```bash
EXPO_PUBLIC_MOCK_API_DELAY_MS=1500 npm run web
EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS=playlist.detail npm run web
```

실제 서버와 연동할 때는 Expo 환경변수로 API base URL을 지정합니다. 이 값이 없으면 mock으로 돌아가지 않고 API URL 누락 오류를 표시합니다.

```bash
EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=https://api.soundlog.p-e.kr npm run ios
```

Soundlog는 웹 서비스를 배포하지 않습니다. 운영 배포 대상은 Expo/EAS로 빌드한 iOS·Android 네이티브 앱이며, 앱은 Vercel 프록시 없이 API와 ML이 함께 배포된 `https://api.soundlog.p-e.kr`을 직접 호출합니다. 저장소의 web·Vercel 관련 설정은 로컬 호환성 확인과 과거 실험용 자료일 뿐 운영 배포 경로에 포함하지 않습니다.

네이티브 실배포 빌드는 `api.soundlog.p-e.kr` 서브도메인을 직접 호출합니다. 로그인은 Soundlog 자체 이메일/비밀번호 계정으로 처리합니다.

## 테스트 설치 빌드

`development`, `preview` EAS profile은 `api.soundlog.p-e.kr`을 직접 바라보도록 설정되어 있습니다.

본인 iPhone을 USB로 연결해 최신 코드를 직접 테스트할 때는 [iPhone 실기기 테스트 가이드](docs/deployment/IOS_PHYSICAL_DEVICE_TESTING.md)를 먼저 확인합니다. 실기기에서 `127.0.0.1`은 Mac이 아니라 iPhone 자신이므로, 로컬 서버를 사용할 때는 Mac의 LAN IP를 앱 빌드 환경변수로 지정해야 합니다.

- API 및 ML: `https://api.soundlog.p-e.kr`
- 개인정보 처리방침: `https://api.soundlog.p-e.kr/legal/privacy`
- 서비스 이용약관: `https://api.soundlog.p-e.kr/legal/terms`
- 고객지원: 실제 수신과 답장이 확인된 메일을 production EAS 환경에 설정
- API source: `server`
- auth: Soundlog 자체 이메일/비밀번호 로그인
- iOS/Android: HTTPS API만 사용

Mock API로 되돌리는 런타임 경로는 제거했습니다. 화면 상태 테스트가 필요하면 서버 fixture 또는 `src/mock-server` 레거시 자료를 별도 개발 도구에서만 사용합니다.

API origin이 최신 서버인지 확인하려면 아래처럼 실행합니다.

```bash
SOUNDLOG_API_ORIGIN=https://api.soundlog.p-e.kr npm run check:api-origin
```

이 검사는 로그인 필수 API도 함께 확인하므로 `SOUNDLOG_CHECK_EMAIL`,
`SOUNDLOG_CHECK_PASSWORD`를 지정하면 해당 smoke 계정으로 로그인합니다. 값을
지정하지 않으면 `@soundlog.test` 임시 계정을 생성해 API와 ML 추천을 검증한 뒤 즉시 삭제합니다.

Android 지인 테스트용 내부 배포 빌드는 아래 명령으로 생성합니다.

```bash
npx eas build --profile preview --platform android
```

iOS는 TestFlight 또는 ad hoc 기기 등록이 필요합니다. App Store/TestFlight에 올릴 production profile은 API와 개인정보 처리방침과 이용약관에 `https://api.soundlog.p-e.kr`을 사용합니다. 새 서버에 공개 문서 경로를 배포하고 실제 수신 가능한 고객지원 메일을 설정한 뒤 릴리스 검사를 통과해야 합니다.

## 문서

- [앱 빌드와 TestFlight 배포](deploy.md)
- [문서 인덱스](docs/README.md)
- [리캡·로그 도메인 기준](docs/product/RECAP_LOG_DOMAIN_MODEL.md)
- [서비스 기획서](docs/product/SOUNDLOG_APP_PLANNING.md)
- [React Native 프론트 고려사항](docs/frontend/RN_FRONTEND_PLANNING_POINTS.md)
- [비개발자용 Codex 개발 가이드](docs/codex/NON_DEVELOPER_CODEX_GUIDE.md)
- [Codex 요청 프롬프트 모음](docs/codex/CODEX_PROMPTS.md)
- [UI 피드백 루프 운영 문서](docs/codex/UI_FEEDBACK_LOOP.md)
- [개발용 테스트 매니저](docs/codex/TEST_MANAGER.md)
- [PR 전용 개발 흐름](docs/codex/PR_ONLY_WORKFLOW.md)
- [GCP 앱 배포 도메인 설정](docs/deployment/SOUNDLOG_SHOP_DOMAIN.md)
- [iPhone 실기기 테스트 가이드](docs/deployment/IOS_PHYSICAL_DEVICE_TESTING.md)
- [Mock Server 안내](src/mock-server/README.md)

## Codex로 개발할 때

비개발자는 기능을 바로 구현해달라고 하기보다, 먼저 “계획 수립 → 리뷰 → 구현 → 검증 → 커밋” 흐름으로 요청하면 안전합니다.

예시:

```text
Soundlog 앱에서 리캡 상세 페이지를 개선하고 싶어.
먼저 관련 문서를 읽고 구현 계획을 세운 뒤, 엣지케이스가 있으면 질문하고,
계획 리뷰 후 구현, 타입체크, 웹 확인까지 진행해줘.
```

프로젝트 전용 Codex 스킬은 `.codex/skills/soundlog-codex-workflow/SKILL.md`에 정리되어 있습니다.

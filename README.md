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
npm run check
npm run web:clear
```

Mock API 상태를 확인할 때는 아래처럼 지연이나 실패를 강제로 줄 수 있습니다.

```bash
EXPO_PUBLIC_MOCK_API_DELAY_MS=1500 npm run web
EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS=playlist.detail npm run web
```

실제 서버와 연동할 때는 Expo 환경변수로 API base URL을 지정합니다. 이 값이 없으면 앱은 기존 mock API를 사용합니다.

```bash
EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=https://api.soundlog.shop npm run web
```

Vercel web 배포는 브라우저 API 호출을 같은 origin에서 처리하도록
`/api/soundlog` rewrite proxy를 사용합니다. rewrite 대상은 `https://api.soundlog.shop`입니다. `vercel.json`의 build command가
`EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server`와
`EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog`를 주입합니다.

네이티브 실배포 빌드는 HTTPS API를 사용해야 합니다. 로그인은 Soundlog 자체 이메일/비밀번호 계정으로 처리합니다.

## 테스트 설치 빌드

`development`, `preview` EAS profile은 Soundlog API 도메인을 바라보도록 설정되어 있습니다.

- Web: `https://soundlog.shop`
- API: `https://api.soundlog.shop`
- API source: `server`
- auth: Soundlog 자체 이메일/비밀번호 로그인
- iOS/Android: HTTPS API만 사용

Mock API로 되돌려 화면 상태를 확인할 때는 `EXPO_PUBLIC_SOUNDLOG_API_SOURCE=mock`으로 실행하거나 `EXPO_PUBLIC_SOUNDLOG_API_BASE_URL`을 비워둡니다.

Android 지인 테스트용 내부 배포 빌드는 아래 명령으로 생성합니다.

```bash
npx eas build --profile preview --platform android
```

iOS는 TestFlight 또는 ad hoc 기기 등록이 필요합니다. App Store/TestFlight에 올릴 production profile도 `https://api.soundlog.shop`을 사용합니다.

## 문서

- [문서 인덱스](docs/README.md)
- [서비스 기획서](docs/product/SOUNDLOG_APP_PLANNING.md)
- [React Native 프론트 고려사항](docs/frontend/RN_FRONTEND_PLANNING_POINTS.md)
- [비개발자용 Codex 개발 가이드](docs/codex/NON_DEVELOPER_CODEX_GUIDE.md)
- [Codex 요청 프롬프트 모음](docs/codex/CODEX_PROMPTS.md)
- [UI 피드백 루프 운영 문서](docs/codex/UI_FEEDBACK_LOOP.md)
- [개발용 테스트 매니저](docs/codex/TEST_MANAGER.md)
- [PR 전용 개발 흐름](docs/codex/PR_ONLY_WORKFLOW.md)
- [soundlog.shop 배포 설정](docs/deployment/SOUNDLOG_SHOP_DOMAIN.md)
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

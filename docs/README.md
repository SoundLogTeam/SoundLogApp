# Soundlog Docs

Soundlog 문서는 목적별로 관리합니다. 공모전 기획, RN 프론트 구현, Codex 협업 문서를 분리해 두었으니 작업 종류에 맞춰 먼저 확인하세요.

## Product

- [서비스 기획서](product/SOUNDLOG_APP_PLANNING.md): 서비스 배경, 핵심 가치, 주요 기능, 데이터 활용 방향
- [여행 사운드트랙 로그 기획 명세](product/SOUNDLOG_TRAVEL_SOUNDTRACK_LOG_SPEC.md): 외부 음악 링크, MomentLog, Recap 중심 MVP 피벗과 화면별 와이어프레임/명세
- [여행 사운드트랙 HTML 와이어프레임](product/SOUNDLOG_TRAVEL_SOUNDTRACK_WIREFRAMES.html): 브라우저에서 보는 화면 와이어프레임과 기능 설명

## Design System

- [Soundlog RN 디자인 시스템](design-system/SOUNDLOG_RN_DESIGN_SYSTEM.md): 현재 구현된 React Native 앱 스타일의 색상, 타이포, radius, 공통 컴포넌트, 화면 조립 레시피

## Frontend

- [RN 프론트 기획 포인트](frontend/RN_FRONTEND_PLANNING_POINTS.md): React Native/Expo 개발 관점의 설계 고려사항
- [메인 페이지 제작 문서](frontend/MAIN_PAGE_RN_BUILD_DOC.md): 홈/추천/뮤직로그 화면 구현 기준
- [음악 큐레이션 페이지 제작 문서](frontend/MUSIC_CURATION_PAGE_RN_BUILD_DOC.md): 플레이리스트 상세/큐레이션 화면 구현 기준
- [Recap 공유 페이지 제작 문서](frontend/RECAP_SHARE_PAGE_RN_BUILD_DOC.md): Recap 미리보기/공유 화면 구현 기준

## Codex

- [비개발자용 Codex 개발 가이드](codex/NON_DEVELOPER_CODEX_GUIDE.md): Codex에게 개발을 맡기는 방식
- [Codex 요청 프롬프트 모음](codex/CODEX_PROMPTS.md): 바로 복사해서 쓸 수 있는 요청문
- [UI 피드백 루프 운영 문서](codex/UI_FEEDBACK_LOOP.md): 자연어 UI 수정 요청을 계획-리뷰-구현-리뷰 루프로 처리하는 방식
- [개발용 테스트 매니저](codex/TEST_MANAGER.md): 페이지 이동, 조건/seed 데이터 검수를 위한 개발 도구
- [PR 전용 개발 흐름](codex/PR_ONLY_WORKFLOW.md): `main` 직접 push를 막고 PR로만 병합하는 방식

## Deployment

- [soundlog.shop 배포 설정](deployment/SOUNDLOG_SHOP_DOMAIN.md): Gabia DNS, Vercel, EC2 API 도메인, EAS env 설정 기준

## Legacy Mock API

- [Mock Server 안내](../src/mock-server/README.md): 서버가 없던 초기 PoC용 자료입니다. 현재 앱 API facade는 서버 API를 기본으로 사용합니다.

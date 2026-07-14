# Soundlog 테스트 매니저 구현 계획

## 목적

개발 모드에서 비개발자와 팀원이 앱의 주요 페이지, 조건문, 로딩/실패 상태, 로컬 데이터 상태를 직접 조작하며 검수할 수 있게 한다.

## 검수 결과

- 음악추천 화면은 별도의 추천 범위 필터를 두지 않고 무드 필터만 사용한다.
- 온보딩 완료 후 무드 필터는 `preferredMoods[0]`을 사용한다.
- 서버 API가 붙은 뒤에는 앱 실행 중 mock/server 전환을 제공하지 않는다.
- Moment Log, Recap, Library, Player, Session 상태를 한 화면에서 빠르게 seed/clear할 방법이 없다.
- 화면 이동 테스트가 탭/카드 탐색에 의존해 QA 속도가 느리다.

## 구현 범위

1. `DevTestManager` 플로팅 버튼
   - `__DEV__`에서만 렌더링한다.
   - 루트 provider 하위에 붙여 모든 화면에서 접근 가능하게 한다.
   - 좌측 하단 기본 위치를 사용하고 드래그 이동을 지원한다.
   - 탭바와 미니 플레이어를 완전히 대체하지 않도록 작은 원형 버튼으로 시작한다.

2. 테스트 매니저 패널
   - 페이지 이동: 홈, 온보딩, 플레이리스트 상세, Recap 리스트, Recap 공유, 보관함, 마이, 카메라
   - 추천 조건: 무드 필터, 여행 모드
   - 위치/세션: 서울/부산 위치 seed, 위치 거부/불가 상태, 여행 시작/종료/리셋
   - 데이터 seed: 샘플 Moment Log, 보관함 좋아요/저장, 현재 재생곡
   - 데이터 clear: Moment Log, 보관함, 추천 이벤트, 플레이어
3. 미완성/기획 불일치 보정
   - 온보딩 완료 시 무드 필터는 첫 선호 무드로 설정한다.

## 주요 파일

- `src/components/dev/DevTestManager.tsx`
- `src/providers/AppProviders.tsx`
- `src/store/playerStore.ts`
- `src/store/libraryStore.ts`
- `src/store/momentLogStore.ts`
- `src/components/onboarding/OnboardingScreen.tsx`
- `docs/codex/TEST_MANAGER.md`

## 검증

- TypeScript: `tsc --noEmit`
- diff whitespace: `git diff --check`
- UI: 웹에서 플로팅 버튼이 이동 가능하고 패널이 열린다.

## 위험과 대응

- 테스트 매니저가 실제 배포 UI에 노출될 위험: `__DEV__` guard로 제한한다.
- 패널이 화면을 가릴 위험: Modal 패널로 열고 닫기 버튼을 제공한다.
- Store 경계를 깨뜨릴 위험: seed/clear는 store action을 통해 수행하고 컴포넌트에서 배열을 직접 변형하지 않는다.
- Query 결과가 이전 상태로 남을 위험: 위치/조건 변경 후 React Query cache를 invalidate한다.

## 계획 리뷰 반영

- Claude CLI 호출은 응답 없이 장시간 대기해 중단했고, `soundlog-ui-reviewer` 체크리스트로 자체 리뷰를 수행했다.
- 리뷰 결과 조건 변경 후 cache invalidation, `__DEV__` guard, store action 경계, 온보딩 필터 불일치 수정이 필요하다고 판단했다.

# Soundlog 테스트 매니저 구현 계획

## 목적

개발 모드에서 비개발자와 팀원이 앱의 주요 페이지, 조건문, 로딩/실패 상태, 로컬 데이터 상태를 직접 조작하며 검수할 수 있게 한다.

## 검수 결과

- 온보딩 완료 후 홈 필터 기본값이 뒤집혀 있다.
  - 현재: `preferredMoods[0]` -> 상단 필터, `travelStyles[0]` -> 무드 필터
  - 기대: 상단 필터는 추천 범위이므로 `전체`, 무드 필터는 `preferredMoods[0]`
- Mock API 실패/지연은 환경변수로만 설정되어 앱 실행 중 상태 전환 테스트가 어렵다.
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
   - 추천 조건: 홈 상단 필터, 무드 필터, 여행 모드
   - 위치/세션: 서울/부산 위치 seed, 위치 거부/불가 상태, 여행 시작/종료/리셋
   - 데이터 seed: 샘플 Moment Log, 보관함 좋아요/저장, 현재 재생곡
   - 데이터 clear: Moment Log, 보관함, 추천 이벤트, 플레이어
   - Mock API: 정상, 느림, 전체 실패, endpoint별 실패

3. Runtime Mock API 상태
   - `src/store/devToolsStore.ts`에 mock delay/fail 상태를 저장한다.
   - `src/mock-server/delay.ts`가 환경변수보다 runtime 설정을 우선 참고한다.
   - Query cache를 invalidate해서 변경 상태가 즉시 반영되게 한다.
   - 실패/지연 설정은 개발 세션용 상태로 두고 영속 저장하지 않는다.

4. 미완성/기획 불일치 보정
   - 온보딩 완료 시 상단 필터는 `전체`, 무드 필터는 첫 선호 무드로 설정한다.
   - 홈 필터와 무드 필터 개념을 계속 분리한다.

## 주요 파일

- `src/components/dev/DevTestManager.tsx`
- `src/store/devToolsStore.ts`
- `src/mock-server/delay.ts`
- `src/providers/AppProviders.tsx`
- `src/store/playerStore.ts`
- `src/store/libraryStore.ts`
- `src/store/momentLogStore.ts`
- `src/components/onboarding/OnboardingScreen.tsx`
- `docs/codex/TEST_MANAGER.md`

## 검증

- TypeScript: `tsc --noEmit`
- diff whitespace: `git diff --check`
- Runtime hook: mock API 정상/느림/실패 전환
- UI: 웹에서 플로팅 버튼이 이동 가능하고 패널이 열린다.

## 위험과 대응

- 테스트 매니저가 실제 배포 UI에 노출될 위험: `__DEV__` guard로 제한한다.
- 패널이 화면을 가릴 위험: Modal 패널로 열고 닫기 버튼을 제공한다.
- Mock 실패 상태가 남아 검수를 방해할 위험: `정상` 버튼으로 모든 runtime mock 설정을 초기화한다.
- Store 경계를 깨뜨릴 위험: seed/clear는 store action을 통해 수행하고 컴포넌트에서 배열을 직접 변형하지 않는다.
- Query 결과가 이전 상태로 남을 위험: mock 상태 변경 후 React Query cache를 invalidate한다.

## 계획 리뷰 반영

- Claude CLI 호출은 응답 없이 장시간 대기해 중단했고, `soundlog-ui-reviewer` 체크리스트로 자체 리뷰를 수행했다.
- 리뷰 결과 runtime mock 변경 후 cache invalidation, `__DEV__` guard, store action 경계, 온보딩 필터 불일치 수정이 필요하다고 판단했다.

# Soundlog 온보딩/프로필 Phase 1 구현 계획

## 1. 작업 목표

첫 실행 사용자가 음악 취향과 여행 성향을 입력하고, 해당 값이 로컬 프로필로 저장되어 홈 추천 필터와 추천 목록 정렬에 반영되도록 구현한다. 현재 홈 필터는 세션 상태에만 있고 사용자 기본 취향이 없으므로, 이번 단계에서는 MVP용 `userProfileStore`를 추가한다.

## 2. 사용자 목표

- 앱을 처음 실행하면 온보딩 설문을 완료한다.
- 선호 장르, 선호 무드, 여행 스타일, 동행 유형, 위치 기반 추천 사용 여부를 선택한다.
- 설문 완료 후 홈으로 이동하고, 선택한 무드/여행 스타일이 기본 추천 필터에 반영된다.
- 마이페이지에서 취향 정보를 다시 수정할 수 있다.

## 3. 범위

### 포함

- `/onboarding` 라우트 추가
- 온보딩 단계형 설문 UI 추가
- 사용자 취향 로컬 persist 저장소 추가
- 홈 첫 진입 시 온보딩 미완료 사용자를 온보딩으로 이동
- 온보딩 완료 시 `homeFilterStore` 기본 필터 설정
- mock 홈 추천 데이터를 사용자 취향/필터 기준으로 정렬 또는 필터링
- 마이페이지의 `취향 정보 수정` 진입 연결

### 제외

- 실제 로그인
- 서버 프로필 동기화
- 실제 위치 권한 요청
- 음악 플랫폼 OAuth 연동
- 비선호 아티스트/곡 입력
- 취향 기반 추천 모델 호출

## 4. 기능 계약

### Entry Point

- 앱 첫 실행 후 홈 탭 진입
- 마이페이지 `취향 정보 수정`

### Exit Point

- 설문 완료 후 홈 탭으로 이동
- 설문 중 나중에 하기 선택 시 기본 프로필로 홈 진입

### 저장 상태

```ts
type UserProfile = {
  completedOnboarding: boolean;
  preferredGenres: string[];
  preferredMoods: string[];
  travelStyles: string[];
  companionType?: string;
  locationRecommendationEnabled: boolean;
  updatedAt?: string;
};
```

스토어:

```txt
src/store/userProfileStore.ts
```

액션:

- `completeOnboarding(profileInput)`
- `skipOnboarding()`
- `resetOnboarding()`
- `updateProfile(profileInput)`

## 5. 온보딩 단계

1. 선호 장르
   - K-POP, 팝, 인디, 발라드, 힙합, R&B, OST
2. 선호 무드
   - 잔잔한, 신나는, 청량한, 감성적인, 활기찬
3. 여행 스타일
   - 산책, 드라이브, 카페 투어, 바다 보기, 축제, 야경 감상
4. 동행 및 위치 추천
   - 혼자, 친구, 연인, 가족
   - 위치 기반 추천 사용 여부

## 6. 홈 추천 반영 정책

### 기본 필터

온보딩 완료 시 선호 무드 첫 번째 값을 `selectedTopFilter`, 선호 여행 스타일 첫 번째 값을 `selectedMoodFilter`에 반영한다. 값이 없으면 `전체`로 유지한다.

### 추천 목록

MVP mock 단계에서는 실제 API 대신 다음 기준으로 추천 목록을 정렬한다.

- 선택된 홈 필터와 일치하는 추천을 상단 노출
- 사용자 선호 무드/여행 스타일과 일치하는 추천을 다음 우선순위로 노출
- 일치 항목이 없으면 기존 기본 추천 유지

## 7. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 사용자가 아무 값도 선택하지 않고 완료 | 기본값 `전체` 기준으로 홈 진입 |
| 온보딩 스킵 | `completedOnboarding`은 true로 저장하고 기본 프로필 사용 |
| 앱 재시작 | AsyncStorage persist로 완료 상태 유지 |
| 마이페이지에서 재수정 | 기존 선택값을 온보딩 초기값으로 표시 |
| 위치 추천 꺼짐 | 위치 추천 API는 호출하지 않는 정책이 필요하지만, MVP mock에서는 UI/프로필 값만 저장 |

## 8. 구현 순서

1. `userProfileStore.ts` 추가
2. `OnboardingScreen` 컴포넌트 추가
3. `/onboarding` 라우트와 Stack 등록
4. 홈 진입 시 온보딩 미완료 redirect 처리
5. 온보딩 완료/스킵 시 홈 필터 기본값 설정
6. 홈 mock 추천에 장르/무드/여행 스타일 메타데이터 추가
7. `homeApi.getMoodRecommendations`에서 사용자 프로필/필터 기준 정렬
8. 마이페이지 `취향 정보 수정` 버튼 연결

## 9. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- 신규 상태에서 홈 진입 시 온보딩 이동
- 설문 완료 후 홈 이동
- 홈 필터가 선호 무드/여행 스타일로 기본 선택됨
- 마이페이지에서 취향 수정 화면 재진입
- 앱 재시작 후 온보딩이 다시 뜨지 않음

## 10. Claude 리뷰 기록

`claude_review_plan.sh IMPLEMENTATION_PLAN_ONBOARDING_PROFILE.md` 실행 결과 Claude 사용량 제한으로 실패했다.

```txt
You've hit your limit · resets 8:10pm (Asia/Seoul)
```

따라서 이번 구현은 자체 체크리스트 기준으로 진행하고, 제한 해제 후 후속 리뷰를 받을 수 있도록 계획 파일을 유지한다.

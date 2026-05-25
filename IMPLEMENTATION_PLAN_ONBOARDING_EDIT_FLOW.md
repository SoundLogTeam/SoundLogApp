# Soundlog 온보딩 편집 플로우 구현 계획

## 1. 작업 목표

현재 마이페이지의 `취향 정보 수정`은 `/onboarding`으로 이동하지만, 온보딩 완료 후 항상 홈으로 이동한다. 신규 가입 온보딩과 기존 사용자 취향 수정은 진입 의도가 다르므로, 이번 작업에서는 `/onboarding?mode=edit` 편집 모드를 추가해 마이페이지에서 취향을 수정한 사용자가 다시 마이페이지로 돌아오도록 개선한다.

## 2. 사용자 목표

- 사용자는 마이페이지에서 저장된 취향을 수정한다.
- 수정 화면은 기존 선택값을 유지한 상태로 열린다.
- 수정 완료 후 홈이 아니라 마이페이지로 돌아온다.
- 변경 없이 나가기를 누르면 저장값을 건드리지 않고 마이페이지로 돌아온다.
- 첫 실행 온보딩은 기존처럼 완료/스킵 후 홈으로 이동한다.

## 3. 기능 계약

### 진입점

- 첫 실행 홈 진입 시 `/onboarding`
- 마이페이지 `취향 정보 수정` 선택 시 `/onboarding?mode=edit`
- 마이페이지 `온보딩 초기화` 선택 시 `/onboarding`

### 종료점

| 모드 | 완료 | 스킵/나가기 |
| --- | --- | --- |
| create | `completeOnboarding` 후 `/` | `skipOnboarding` 후 `/` |
| edit | `updateProfile` 후 `/my` | 저장 없이 `/my` |

### 영향을 받는 파일

```txt
src/components/onboarding/OnboardingScreen.tsx
app/(tabs)/my.tsx
IMPLEMENTATION_PLAN_ONBOARDING_EDIT_FLOW.md
```

## 4. 상태/저장 정책

- 신규 온보딩은 기존 `completeOnboarding`, `skipOnboarding`을 유지한다.
- 편집 모드는 기존 프로필 기반 draft를 만들고, 완료 시 `updateProfile`만 호출한다.
- 편집 모드의 `나가기`는 `skipOnboarding`을 호출하지 않는다.
- 홈 필터 반영은 완료 시 create/edit 모두 적용한다.

## 5. UI 정책

### 신규 온보딩

- 상단 보조 문구: `Soundlog setup`
- 메인 카피: `여행 취향을 알수록 선곡이 더 가까워져요`
- 우측 액션: `나중에 하기`
- 완료 버튼: `완료하고 시작하기`

### 편집 모드

- 상단 보조 문구: `Soundlog profile`
- 메인 카피: `지금 여행 취향에 맞게 추천을 다시 맞춰요`
- 우측 액션: `변경 없이 나가기`
- 완료 버튼: `수정 완료`

## 6. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 편집 모드인데 프로필 값이 비어 있음 | 빈 선택값 그대로 편집 가능 |
| 편집 중 뒤로가기 | Expo Router 기본 동작 유지 |
| 편집 모드 나가기 | 저장하지 않고 `/my`로 이동 |
| 온보딩 초기화 후 진입 | create 모드로 동작 |
| 완료 시 선택값 없음 | 기존처럼 빈 배열 저장 가능 |

## 7. 구현 순서

1. `OnboardingScreen`에서 `useLocalSearchParams`로 `mode` 읽기
2. `isEditMode` 파생값 추가
3. copy와 버튼 문구를 모드별로 분기
4. `finish`에서 edit/create 저장 액션과 이동 경로 분기
5. `handleSkip`에서 edit/create 동작 분기
6. 마이페이지 `취향 정보 수정` 라우트를 `/onboarding?mode=edit`로 변경
7. 타입체크 및 export 검증

## 8. Codex 계획 리뷰

### 리뷰 결과

- `/onboarding` 화면을 새로 만들거나 별도 편집 화면을 만들면 현재 온보딩 컴포넌트와 선택지 로직이 중복된다.
- 편집 모드에서 `skipOnboarding`을 호출하면 기존 사용자 프로필이 기본값으로 덮일 수 있어 데이터 신뢰 문제가 생긴다.
- 편집 완료 후 홈으로 이동하면 사용자는 방금 수정한 설정이 저장됐는지 확인하기 어렵다.
- 홈 필터는 편집 완료 시에도 갱신되는 편이 사용자의 기대와 맞다.

### 반영 사항

- 기존 `OnboardingScreen`에 query 기반 편집 모드만 추가한다.
- 편집 모드 나가기는 저장 액션 없이 `/my`로 이동한다.
- 편집 완료는 `updateProfile` 후 `/my`로 이동한다.
- 완료 시 홈 필터 기본값 갱신 로직은 create/edit 모두 공유한다.

## 9. 코드 리뷰 체크포인트

- create 모드 첫 실행 redirect가 깨지지 않는지 확인
- edit 모드에서 나가기 시 기존 profile이 유지되는지 확인
- reset onboarding은 create 모드로 열리는지 확인
- router path 타입 우회를 최소화했는지 확인
- 홈 필터 업데이트가 기존 동작과 동일한지 확인

## 10. 검증 계획

```bash
npm run typecheck
git diff --check
npx expo-doctor
npx expo export --platform android --output-dir .expo-export-smoke-android
npx expo export --platform ios --output-dir .expo-export-smoke-ios
npx expo export --platform web --output-dir .expo-export-smoke-web
```

검증 후 `.expo-export-smoke-*` 산출물은 삭제한다.

## 11. Codex 코드 리뷰 및 반영

구현 후 Codex 코드 리뷰에서 다음 견고성 이슈를 확인하고 반영했다.

- 문제: Expo Router의 query parameter는 중복 전달 시 배열 형태가 될 수 있는데, `params.mode === 'edit'`만 사용하면 드문 케이스에서 편집 모드 판별이 실패할 수 있다.
- 반영: `mode` 값을 배열/문자열 모두 처리하도록 정규화한 뒤 `isEditMode`를 계산하게 수정했다.

# Soundlog Recap 공유 Not Found 처리 구현 계획

## 1. 작업 목표

현재 `recapApi.getRecapShare(id)`는 알 수 없는 ID가 들어와도 기본 샘플 Recap(`seoul-night`)을 반환한다. 이 동작은 잘못된 링크, 삭제된 로컬 기록, 깨진 URL을 열었을 때 사용자에게 다른 여행 기록을 보여줄 수 있어 신뢰를 해친다.

이번 작업에서는 존재하지 않는 Recap ID를 열면 샘플 fallback이 아니라 빈 상태를 보여주도록 수정한다.

## 2. 사용자 목표

- 사용자는 잘못된 Recap 링크를 열었을 때 엉뚱한 기록을 보지 않는다.
- 공유할 기록이 없다는 메시지를 명확히 확인한다.
- 정상 mock/local Recap 링크는 기존처럼 열린다.

## 3. 기능 계약

### 진입점

- `/recap-share/:id`
- 홈 Music Log 카드
- Recap 리스트 카드

### 종료점

- 정상 ID: 기존 Recap 공유 화면
- 잘못된 ID: `RecapShareEmptyState`
- 네트워크 실패: `RecapShareErrorState`

### 영향을 받는 파일

```txt
src/api/recapApi.ts
src/components/recap-share/RecapShareScreen.tsx
IMPLEMENTATION_PLAN_RECAP_SHARE_NOT_FOUND.md
```

## 4. 정책

- `id`가 있고 `recapShareById[id]`가 없으면 `undefined`를 반환한다.
- `id`가 없으면 API 요청을 보내지 않고 화면에서 empty state로 처리한다.
- 기존 `seoul-night` mock은 `recapShareById['seoul-night']`로만 접근한다.
- 알 수 없는 ID를 네트워크 에러로 보지 않는다. 데이터 없음 상태다.

## 5. Codex 계획 리뷰

### 리뷰 결과

- 잘못된 ID를 샘플 데이터로 대체하면 사용자는 자신의 기록이 잘못 연결됐다고 느낄 수 있다.
- `undefined` ID까지 query를 실행하면 잠깐 로딩이 보인 뒤 empty로 바뀌어 불필요한 상태 전환이 생긴다.
- 정상 mock 데이터를 유지하려면 fallback 샘플 자체를 없애기보다 `recapShareById`에 등록된 ID만 허용하면 된다.

### 반영 사항

- `getRecapShare`는 `RecapShare | undefined`를 반환한다.
- `RecapShareScreen`은 `recapId`가 없을 때 원격 query를 비활성화한다.
- 정상 샘플은 `seoul-night`, `log-1`, `log-2`, `log-3`처럼 명시 ID로만 접근한다.

## 6. 구현 순서

1. `recapApi.getRecapShare`에서 기본 fallback 제거
2. `RecapShareScreen`의 query enabled 조건을 `Boolean(recapId) && !localRecap`로 수정
3. 타입체크로 query data optional 처리가 안전한지 확인
4. 코드 리뷰 후 검증

## 7. 코드 리뷰 체크포인트

- 정상 Recap ID가 여전히 열리는지 확인
- 잘못된 ID가 empty state로 떨어지는지 확인
- ID 없는 상태에서 불필요한 query loading이 발생하지 않는지 확인
- 에러 상태와 empty 상태가 혼동되지 않는지 확인

## 8. 검증 계획

```bash
npm run typecheck
git diff --check
npx expo-doctor
npx expo export --platform android --output-dir .expo-export-smoke-android
npx expo export --platform ios --output-dir .expo-export-smoke-ios
npx expo export --platform web --output-dir .expo-export-smoke-web
```

검증 후 `.expo-export-smoke-*` 산출물은 삭제한다.

## 9. Codex 코드 리뷰 및 반영

구현 후 Codex 코드 리뷰에서 `recapShare` 기본 샘플이 더 이상 API fallback으로 쓰이지 않고, `recapShareById['seoul-night']`로만 명시 참조되는 것을 확인했다.

- 추가 수정 필요 사항: 없음
- 유지 정책: 알 수 없는 ID는 데이터 없음으로 처리하고, 네트워크 실패와 구분한다.

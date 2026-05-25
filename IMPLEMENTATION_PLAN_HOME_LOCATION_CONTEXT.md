# Soundlog 홈 위치 컨텍스트 Phase 1 구현 계획

## 1. 작업 목표

홈 화면에서 사용자가 위치 기반 추천 상태를 확인하고, 현재 위치를 1회 갱신해 추천 카드와 순간 저장 컨텍스트에 반영할 수 있도록 구현한다. 이번 단계는 백그라운드 위치 추적이 아니라 사용자가 홈에서 요청하거나 위치 추천이 켜져 있을 때 foreground 위치를 확인하는 MVP 범위다.

## 2. 사용자 목표

- 홈에서 위치 기반 추천이 켜져 있는지 확인한다.
- 버튼을 눌러 현재 위치를 확인하고 추천 컨텍스트를 갱신한다.
- 위치 권한 거부/조회 실패/위치 추천 꺼짐 상태를 명확히 이해한다.
- 확인된 위치가 현재 여행 세션과 카메라 순간 저장에 재사용된다.

## 3. 범위

### 포함

- 홈 위치 컨텍스트 카드 추가
- foreground 위치 1회 조회 액션 추가
- `travelSessionStore`에 위치 상태와 갱신 시각 추가
- 위치 추천이 꺼진 프로필 상태 처리
- 위치 기반 featured playlist mock 정렬
- 위치 권한 문구 확장

### 제외

- 백그라운드 위치 추적
- 실시간 위치 watch
- 실제 한국관광공사 위치기반 관광정보 API 호출
- 지도 화면
- OS 설정 앱 딥링크 상세 처리
- 위치 기반 세션 자동 시작/종료

## 4. 기능 계약

### Entry Point

- 홈 화면 진입
- 홈 위치 컨텍스트 카드의 `현재 위치 확인` 버튼
- 위치 추천이 꺼진 경우 `위치 추천 켜기` 버튼

### Exit Point

- 위치 확인 성공 시 `travelSessionStore.currentLocation` 저장
- 위치 확인 실패/권한 거부 시 홈에 상태 안내

### 상태

```ts
type HomeLocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';
```

`travelSessionStore` 추가 상태:

- `locationStatus`
- `locationUpdatedAt`
- `currentLocation`

## 5. 권한 정책

- 앱 실행 즉시 위치 권한을 요청하지 않는다.
- 온보딩의 위치 추천 값이 켜져 있어도 홈 첫 화면에서는 설명 카드와 CTA를 먼저 보여준다.
- 사용자가 `현재 위치 확인`을 누르면 `expo-location` foreground 권한을 요청한다.
- 권한이 없거나 조회 시간이 초과되면 추천은 기존 mock/fallback 데이터를 유지한다.
- 이번 단계에서는 백그라운드 위치 권한을 요청하지 않는다.

## 6. 추천 반영 정책

실제 TourAPI 연동 전까지는 mock 기반으로 다음처럼 반영한다.

- 위치가 없으면 기존 featured playlist 순서 유지
- 위치가 있고 위도 36.5 미만이면 부산 추천 우선
- 위치가 있고 위도 36.5 이상이면 서울 추천 우선
- 프로필의 `locationRecommendationEnabled`가 false면 위치 기반 정렬을 하지 않음

## 7. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 위치 추천 꺼짐 | 카드에서 `위치 추천 켜기` CTA 제공 |
| 권한 거부 | 권한 없이 기본 추천을 유지한다는 안내 |
| 위치 조회 timeout | 마지막 위치가 있으면 유지, 없으면 기본 추천 유지 |
| 웹 환경 | 위치 버튼은 사용할 수 있으나 expo-location 동작 차이를 고려해 실패 상태 처리 |
| 앱 재시작 | 위치는 민감 정보이므로 세션 메모리만 유지하고 persist하지 않음 |

## 8. 구현 순서

1. `travelSessionStore`에 위치 상태 필드 추가
2. `LocationContextCard` 컴포넌트 추가
3. 홈 화면에서 위치 카드 렌더링 및 위치 확인 액션 연결
4. `homeApi.getFeaturedPlaylists`에 위치/위치 추천 파라미터 추가
5. `useFeaturedPlaylistsQuery` query key 확장
6. `app.json` 위치 권한 문구를 추천/기록 목적에 맞게 보강
7. 타입체크/Expo Doctor/export 검증

## 9. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- 위치 추천 꺼짐 상태에서 카드 CTA 노출
- 위치 확인 성공 시 카드 문구와 현재 위치 라벨 갱신
- 위치 확인 실패 시 홈 추천이 깨지지 않음
- 카메라 순간 저장에서 마지막 위치가 재사용됨

## 10. Claude 리뷰 기록

`claude_review_plan.sh IMPLEMENTATION_PLAN_HOME_LOCATION_CONTEXT.md` 실행 결과 Claude 사용량 제한으로 실패했다.

```txt
You've hit your limit · resets 8:10pm (Asia/Seoul)
```

따라서 이번 구현은 자체 체크리스트 기준으로 진행하고, 제한 해제 후 후속 리뷰를 받을 수 있도록 계획 파일을 유지한다.

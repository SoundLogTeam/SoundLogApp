# Soundlog TourAPI 장소 컨텍스트 연동 구현 계획

## 1. 작업 목표

현재 홈 추천은 mock 데이터와 위치 좌표 기반 정렬만 사용한다. 다음 단계에서는 한국관광공사 TourAPI를 붙일 수 있는 프론트 API 계층과 장소 컨텍스트 모델을 설계해, 사용자의 현재 좌표를 `주변 관광지/장소 맥락`으로 변환하는 기반을 만든다.

이번 구현의 핵심은 실제 추천 모델이 아니라, 추천 모델이 사용할 수 있는 안정적인 입력값을 만드는 것이다.

## 2. 사용자 목표

- 홈에서 현재 위치 근처의 대표 장소명을 확인한다.
- 위치 기반 추천이 단순 좌표가 아니라 관광지/카테고리/거리 기반으로 작동한다고 느낀다.
- 순간 저장 시 `현재 위치 37.123, 127.123`보다 의미 있는 장소명이 기록된다.
- TourAPI 장애나 API 키 미설정 상황에서도 앱이 깨지지 않고 mock/fallback으로 동작한다.

## 3. 범위

### 포함

- TourAPI 전용 API 클라이언트 계층 추가
- 위치 기반 관광정보 조회 응답을 앱 도메인 타입으로 매핑
- `PlaceContext` 타입 추가
- `useNearbyPlacesQuery` 추가
- 홈 위치 카드에 현재 대표 장소/주변 장소 수 표시
- `travelSessionStore`에 `currentPlace` 저장
- 순간 저장 시 `currentPlace`가 있으면 장소명 우선 사용
- API 키 미설정/네트워크 실패/mock fallback 정책 문서화 및 최소 구현

### 제외

- 실제 음악 추천 서버 연동
- 벡터 DB/임베딩
- 전체 TourAPI 지역 일괄 수집
- 관광사진 API 연동
- 행사/축제 API 연동
- 지도 화면
- 백그라운드 위치 추적

## 4. 기능 계약

### Entry Point

- 홈에서 `현재 위치 확인` 성공
- 홈 진입 시 이미 `currentLocation`이 있는 경우
- 카메라 순간 저장 진입 시 기존 `currentPlace` 재사용

### Exit Point

- 대표 장소가 있으면 홈 위치 카드와 여행 세션에 반영
- 주변 장소가 없으면 기존 좌표 기반 label 유지
- API 실패 시 홈 추천과 순간 저장은 fallback 상태로 유지

### 앱 도메인 타입

```ts
type PlaceContext = {
  id: string;
  title: string;
  address?: string;
  category?: string;
  contentType?: string;
  distanceMeters?: number;
  imageUrl?: string;
  location?: GeoPoint;
  overview?: string;
  source: 'mock' | 'tour-api';
};
```

## 5. API 계층 설계

### 신규 파일

```txt
src/api/tourApi.ts
src/api/tourQueries.ts
src/mappers/tourMappers.ts
src/mocks/tourMocks.ts
```

### 환경 변수

```txt
EXPO_PUBLIC_TOUR_API_BASE_URL
EXPO_PUBLIC_TOUR_API_SERVICE_KEY
```

API 키가 없으면 `tourMocks`를 사용한다.

### Query

```ts
useNearbyPlacesQuery({
  location,
  enabled,
  radiusMeters,
});
```

권장 설정:

- `enabled`: 위치 추천 ON + 위치 있음
- `staleTime`: 5분
- `gcTime`: 30분
- `retry`: 1회

## 6. Fallback 정책

추천/장소 API 실패는 사용자 경험을 직접 망칠 수 있으므로 fallback이 필요하다.

권장 정책:

1. API 키가 없으면 mock 주변 장소 사용
2. 네트워크 실패 시 마지막 성공 캐시를 유지
3. 캐시가 없으면 좌표 기반 label 유지
4. 사용자는 실패를 오류 화면으로 보지 않고, 위치 카드 하단에서 “장소 정보를 임시로 불러오지 못했어요” 정도로 확인

구현 전 확인 필요:

- 실제 제출용 데모에서 API 키가 없을 때 mock fallback을 허용할지
- API 실패 시 사용자에게 명확히 노출할지, 조용히 좌표 fallback으로 둘지

## 7. 홈 반영 방식

### LocationContextCard 확장

현재:

- 위치 추천 ON/OFF
- 좌표 label
- 위치 갱신 시각

추가:

- 대표 장소명
- 카테고리/거리
- 주변 장소 수
- 장소 정보 실패 안내

### Featured Playlist 정렬

TourAPI 장소 컨텍스트를 바로 음악 추천에 넣기 전까지는 mock 추천 정렬에 반영한다.

- `place.title`, `place.category`, `contentType`이 해변/바다 계열이면 부산/바다 추천 우선
- 야경/문화시설/도시 계열이면 서울/야경 추천 우선
- 축제/행사 계열이면 축제형 추천 우선

## 8. 순간 저장 반영

`MomentCaptureScreen` 저장 시:

1. `travelSessionStore.currentPlace?.title`이 있으면 `placeName`으로 사용
2. 없으면 기존 `formatPlaceLabel(location)` 사용
3. 추후 `MomentLog`에 `placeId`, `placeCategory`를 추가할 수 있도록 타입 확장 여지를 둠

## 9. 예외 상태

| 상황 | 처리 |
| --- | --- |
| API 키 없음 | mock 장소 데이터 사용 |
| 위치 권한 거부 | TourAPI 호출하지 않음 |
| 주변 장소 0개 | 좌표 label 유지 |
| TourAPI timeout | 캐시 또는 좌표 fallback |
| 이미지 URL 없음 | 카드 UI는 텍스트 중심 유지 |
| 응답 필드 누락 | mapper에서 안전한 기본값 적용 |
| API quota 초과 | 실패 안내 + fallback |

## 10. 구현 순서

1. `PlaceContext` 타입 추가
2. TourAPI mock 데이터와 mapper 작성
3. TourAPI client 작성
4. `useNearbyPlacesQuery` 추가
5. 홈에서 위치 성공 후 nearby places query 연결
6. 대표 장소를 `travelSessionStore.currentPlace`에 저장
7. `LocationContextCard`에 장소 정보 표시
8. featured playlist 정렬에 place context 반영
9. 순간 저장의 placeName 생성 로직 변경
10. 검증 및 export smoke 실행

## 11. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- API 키 없는 상태에서 mock 장소 표시
- 위치 없음 상태에서 API 호출이 발생하지 않음
- 위치 있음 상태에서 대표 장소가 홈 카드에 표시
- 순간 저장 시 대표 장소명이 로그에 저장
- TourAPI 실패를 강제로 만들었을 때 앱이 fallback으로 유지

## 12. Claude 리뷰 기록

`claude_review_plan.sh IMPLEMENTATION_PLAN_TOUR_API_PLACE_CONTEXT.md` 실행 결과 Claude 사용량 제한으로 실패했다.

```txt
You've hit your limit · resets 8:10pm (Asia/Seoul)
```

따라서 구현 전에는 이 계획의 fallback 정책과 API 키 운영 방식을 한 번 더 확인하고 진행한다.

## 13. 구현 기록

- API 키가 없거나 TourAPI 호출이 실패하면 mock 장소 데이터를 반환하도록 구현했다.
- TourAPI `locationBasedList2` 응답을 `PlaceContext`로 매핑하는 mapper를 추가했다.
- 홈 위치 카드에 대표 장소, 카테고리/거리, 주변 장소 수, mock fallback 안내를 표시하도록 확장했다.
- 대표 장소를 `travelSessionStore.currentPlace`에 저장하고, 순간 저장 시 장소명을 우선 사용하도록 연결했다.
- Featured playlist 정렬은 `PlaceContext`가 있으면 장소명/카테고리/설명을 기준으로 먼저 점수화하고, 없으면 기존 좌표 기반 정렬을 사용한다.

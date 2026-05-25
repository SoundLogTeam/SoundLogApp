# Soundlog 추천 피드백 이벤트 로그 구현 계획

## 1. 작업 목표

현재 앱은 플레이리스트 재생, 좋아요, 저장, 무드 필터 변경 같은 사용자 반응을 화면 상태나 보관함 상태로만 처리한다. 다음 단계에서는 추천 품질 고도화와 지역 사운드 트렌드 집계를 위해, 사용자 행동을 로컬 이벤트 로그로 남기는 기반을 구축한다.

이번 구현은 서버 전송 전 단계의 MVP다. 이벤트를 로컬에 안정적으로 쌓고, 추후 추천 API/분석 서버로 전송할 수 있는 형태로 모델링한다.

## 2. 사용자 목표

- 사용자는 별도 조작 없이 기존처럼 음악을 재생하고 좋아요/저장한다.
- 앱은 사용자의 재생, 좋아요, 저장, 무드 변경, 장소 컨텍스트를 조용히 기록한다.
- 기록된 데이터는 이후 “나에게 더 맞는 추천”과 “지역 기반 사운드 트렌드”의 근거가 된다.

## 3. 범위

### 포함

- `recommendationEventStore` 추가
- 이벤트 타입 정의
- 플레이리스트 곡 재생 이벤트 기록
- 미니 플레이어 재생/일시정지 이벤트 기록
- 좋아요/저장 토글 이벤트 기록
- 홈 무드/상단 필터 변경 이벤트 기록
- 이벤트 context에 현재 장소, 선택 무드, playlistId 포함
- 개발 모드에서만 마이페이지에 최근 이벤트 카운트 표시
- 이벤트 최대 보관 개수 제한

### 제외

- 서버 전송 API
- 배치 업로드/재시도 큐
- 실제 추천 모델 반영
- 실시간 분석 대시보드
- 외부 음악 플랫폼 재생 시간 측정
- 백그라운드 재생 시간 추적
- 실제 queue 없는 이전/다음 skip 이벤트 기록
- raw GPS 좌표 영구 저장
- 곡 완료 청취(`track_complete`) 이벤트

## 4. 이벤트 모델

```ts
type RecommendationEventType =
  | 'track_play'
  | 'track_pause'
  | 'track_resume'
  | 'track_like'
  | 'track_unlike'
  | 'track_save'
  | 'track_unsave'
  | 'mood_filter_change'
  | 'top_filter_change';

type RecommendationEvent = {
  context: RecommendationEventContext;
  createdAt: string;
  id: string;
  playlistId?: string;
  sessionId: string;
  trackId?: string;
  type: RecommendationEventType;
  value?: string;
};

type RecommendationEventContext = {
  moodFilter?: string;
  placeCategory?: string;
  placeId?: string;
  placeName?: string;
  topFilter?: string;
  travelMode?: TravelMode;
};
```

## 5. 저장소 설계

신규 파일:

```txt
src/store/recommendationEventStore.ts
```

상태:

- `events`
- `isHydrated`
- `sessionId`

액션:

- `addEvent(input)`
- `clearEvents()`
- `setHydrated(isHydrated)`

Selector:

- `selectRecentEvents(state, limit)`

보관 정책:

- 로컬에는 최근 200개만 유지
- 새 이벤트를 맨 앞에 넣고, 200개를 초과하면 오래된 이벤트를 제거한다.
- `createdAt`은 `new Date().toISOString()` 기준 UTC ISO-8601로 저장한다.
- 이후 서버 전송 기능이 생기면 `syncStatus`와 `lastSyncedAt` 추가

Persist 정책:

- Zustand `persist` + `createJSONStorage(() => AsyncStorage)` 사용
- persist 대상은 `events`만 저장한다. `sessionId`는 앱 실행 단위 메모리 값으로 유지한다.
- `onRehydrateStorage`에서 `isHydrated`를 true로 만든다.
- 이벤트 기록은 `isHydrated` 이후에만 수행한다. hydration 전 이벤트는 유실 위험이 있으므로 기록하지 않는다.

## 6. 이벤트 발생 지점

### 플레이리스트 상세

- `playTrack(track)` 호출 시 `track_play`
- `toggleLiked()` 호출 시 `track_like` 또는 `track_unlike`
- `toggleSaved()` 호출 시 `track_save` 또는 `track_unsave`

### 미니 플레이어

현재 미니 플레이어의 이전/다음 아이콘은 UI만 있고 실제 queue가 없다. 잘못된 추천 학습 신호를 남기지 않기 위해 이번 단계에서는 skip 이벤트를 기록하지 않는다.

- 재생/일시정지 버튼을 `Pressable`로 명확히 감싼다.
- pause 전환 시 `track_pause`
- resume 전환 시 `track_resume`
- 이전/다음 버튼은 queue 구현 후 이벤트 기록 범위에 포함한다.

### 홈 필터

- 상단 필터 변경 시 `top_filter_change`
- 무드 필터 변경 시 `mood_filter_change`

## 7. Context 수집 정책

이벤트 context는 현재 전역 상태에서 즉시 구성한다.

참조 store:

- `useTravelSessionStore`: `currentPlace`, `selectedMode`
- `useHomeFilterStore`: `selectedMoodFilter`, `selectedTopFilter`
- `usePlayerStore`: `playlistId`, `currentTrack`

헬퍼:

```txt
src/utils/recommendationEventContext.ts
```

역할:

- 여러 컴포넌트에서 context 생성 로직이 중복되지 않도록 통합
- 이벤트가 없거나 장소가 없는 상태도 안전하게 처리
- privacy를 위해 raw GPS 좌표는 이벤트에 저장하지 않는다.
- 장소 컨텍스트가 있으면 `placeId`, `placeName`, `placeCategory`만 저장한다.

확인된 기존 store:

- `src/store/homeFilterStore.ts`에 `selectedMoodFilter`, `selectedTopFilter` 존재 확인
- `src/store/travelSessionStore.ts`에 `currentPlace`, `selectedMode` 존재 확인

## 8. UI 반영

마이페이지에 작은 개발용 상태를 추가한다.

- `추천 피드백 로그`
- 최근 이벤트 개수
- 마지막 이벤트 시간
- `초기화` 버튼

이 카드는 `__DEV__` 환경에서만 노출한다. 프로덕션 사용자에게는 내부 분석/초기화 UI를 노출하지 않는다.

## 9. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 현재 곡 없음 | track 이벤트 기록하지 않음 |
| playlistId 없음 | 이벤트는 기록하되 playlistId 생략 |
| 장소 없음 | context에서 장소 필드 생략 |
| 좋아요/저장 중복 토글 | 토글 전 상태로 next 상태를 계산하고, toggle 후 결과 타입을 명시적으로 기록 |
| 이벤트 과다 누적 | 최신 200개 유지, 오래된 이벤트 삭제 |
| 앱 재시작 | AsyncStorage persist로 유지 |
| 개인정보 우려 | raw GPS 좌표는 이벤트에 저장하지 않음 |
| hydration 전 이벤트 발생 | 기록하지 않고 무시 |

## 10. 구현 순서

1. `RecommendationEvent` 타입과 store 추가
2. context 생성 헬퍼 추가
3. 플레이리스트 상세의 재생/좋아요/저장 이벤트 연결
4. 미니 플레이어 버튼을 `Pressable`로 정리하고 pause/resume 이벤트 연결
5. 홈 필터 변경 이벤트 연결
6. 마이페이지에 `__DEV__` 이벤트 로그 상태 카드 추가
7. 타입체크 및 Expo export 검증

## 11. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform android --output-dir .expo-export-smoke-android
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- 플레이리스트 곡 재생 후 이벤트 카운트 증가
- 좋아요/저장 토글 후 이벤트 타입이 결과 상태와 맞는지 확인
- 홈 필터 변경 후 이벤트 카운트 증가
- 마이페이지에서 최근 이벤트 수 확인
- 이벤트 초기화 후 카운트 0 확인
- 이벤트 payload에 raw GPS 좌표가 없는지 확인

## 12. Claude 리뷰 기록

Claude 리뷰 완료.

주요 지적:

- persist/hydration 전략이 부족함
- raw GPS 좌표를 행동 로그에 저장하는 것은 privacy 리스크가 있음
- 좋아요/저장 이벤트는 toggle 결과 기준으로 기록해야 함
- 실제 queue가 없는 skip 이벤트를 학습 신호로 남기면 데이터 품질이 나빠짐
- 개발용 로그 UI는 production에 노출되면 안 됨

반영:

- 이벤트 context에서 raw GPS 좌표 제거
- 장소 컨텍스트만 저장
- skip 이벤트는 Phase 1에서 제외
- persist 대상과 hydration 정책 명시
- 개발용 마이페이지 카드는 `__DEV__` 한정으로 변경
- Android export 검증 추가
- `track_complete`는 후속 gap으로 명시

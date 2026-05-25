# Soundlog 세션 기반 Recap 리스트 구현 계획

## 1. 작업 목표

현재 Recap 탭은 로컬 `MomentLog`를 개별 카드로 나열한다. 직전 단계에서 `MomentLog.sessionId`와 현재 여행 세션 제어가 추가되었으므로, 다음 단계에서는 Recap 리스트를 **여행 세션 단위로 묶어 보여주는 구조**로 개선한다.

MVP에서는 세션 전체를 영상/필름으로 생성하지 않고, 같은 `sessionId`를 가진 순간 로그를 하나의 여행 Recap 카드로 묶는다. 카드를 누르면 해당 세션의 대표 순간을 기반으로 기존 Recap 공유 화면을 열어, 기존 공유 UX와 자연스럽게 연결한다.

## 2. 사용자 목표

- 사용자는 Recap 탭에서 저장한 순간을 여행 단위로 확인한다.
- 한 여행에서 여러 장면을 저장하면 하나의 Recap 카드에 묶여 보인다.
- 카드에는 대표 이미지, 대표 장소, 대표 음악, 기록 개수가 표시된다.
- 세션 정보가 없는 기존 로그도 유실되지 않고 개별 Recap으로 표시된다.
- 카드를 누르면 공유 가능한 Recap 화면으로 이동한다.

## 3. 범위

### 포함

- `MomentLog[]`를 `sessionId` 기준으로 그룹핑하는 유틸 추가
- 세션 그룹을 `RecapItem`으로 변환하는 유틸 추가
- Recap 리스트에서 로컬 세션 Recap을 우선 노출
- `RecapItem`에 optional `momentCount`, `sessionId` 추가
- `RecapListCard`에 저장된 순간 개수 표시
- 세션 Recap 카드 선택 시 `/recap-share/:id` 이동
- `RecapShareScreen`에서 세션 Recap ID를 로컬 로그 그룹으로 해석

### 제외

- 세션 전체 사진을 모두 보여주는 필름 상세
- 영상형 Recap 생성
- Recap 삭제/편집
- 서버 Recap API
- 세션별 지도/경로 표시
- 세션 종료 시 자동 Recap 생성 상태 머신

## 4. ID 정책

세션 Recap ID는 로컬 전용 prefix를 사용한다.

```ts
const SESSION_RECAP_ID_PREFIX = 'session-recap__';
```

예시:

```txt
session-recap__session-1710000000000
```

이유:

- 기존 `MomentLog.id`와 충돌하지 않는다.
- `RecapShareScreen`에서 prefix를 기준으로 세션 Recap인지 안전하게 구분할 수 있다.
- URL path에서 쓰기 쉬운 단순 문자열이다.

## 5. 데이터 설계

### `RecapItem` 확장

```ts
type RecapItem = {
  momentCount?: number;
  sessionId?: string;
};
```

기존 mock recap은 필드를 갖지 않아도 된다.

### Recap Group

신규 내부 타입:

```ts
type MomentLogGroup = {
  id: string;
  logs: MomentLog[];
  sessionId?: string;
};
```

그룹 기준:

- `sessionId`가 있으면 같은 sessionId끼리 묶는다.
- `sessionId`가 없으면 `MomentLog.id` 기준으로 단독 그룹을 만든다.
- 각 그룹의 대표 로그는 `createdAt`이 가장 최신인 로그로 한다.
- 그룹 정렬은 대표 로그의 `createdAt` 내림차순이다.

## 6. 화면 설계

### RecapListScreen

현재:

- `momentLogs.map(momentLogToRecapItem)`
- 로컬 로그와 mock recap을 단순 병합

변경:

- `createMomentLogGroups(momentLogs)` 사용
- 각 그룹을 `momentLogGroupToRecapEntry(group)`로 변환
- entry에는 `item`, `imageUrl`, `shareId` 포함
- 카드 선택 시 `shareId`로 이동

```ts
type RecapListEntry = {
  imageUrl?: string;
  item: RecapItem;
  shareId: string;
};
```

### RecapListCard

기존 정보:

- 제목
- 장소
- 아티스트
- 날짜

추가 정보:

- `momentCount`가 2 이상이면 `저장된 순간 N개` 표시
- 1개면 기존처럼 음악/아티스트 중심 표시

### RecapShareScreen

변경:

- `recapId`가 session recap ID이면 `sessionId`를 추출한다.
- `momentLogStore.logs`에서 같은 sessionId 로그를 찾는다.
- 그룹 대표 로그로 `RecapShare`를 생성한다.
- 세션 그룹이 없으면 기존 단일 MomentLog → remote fallback 순서 유지

MVP에서는 공유 카드가 세션의 모든 사진을 합성하지 않고, 대표 순간의 사진/음악을 사용한다.

## 7. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 로컬 로그 없음 | 기존 빈 상태 + mock sample 유지 |
| sessionId 없는 기존 로그 | 개별 Recap 카드로 유지 |
| 세션에 track 없는 로그만 있음 | `저장된 순간 / Soundlog` fallback |
| 세션에 위치 없는 로그만 있음 | `위치 없음` fallback |
| 잘못된 session recap id | 기존 remote/mock fallback |
| 같은 세션에 여러 장소가 있음 | 대표 로그의 장소를 카드 대표 장소로 사용 |
| 같은 세션에 여러 곡이 있음 | 대표 로그의 곡을 카드 대표 곡으로 사용 |
| 기존 mock recap | momentCount 없이 기존 표시 유지 |

## 8. 구현 파일 계획

수정 파일:

```txt
src/types/domain.ts
src/utils/recapMappers.ts
src/components/recap/RecapListScreen.tsx
src/components/recap/RecapListCard.tsx
src/components/recap-share/RecapShareScreen.tsx
```

신규 파일은 만들지 않는다.

## 9. 구현 순서

1. `RecapItem` optional 필드 추가
2. `recapMappers.ts`에 session recap id helper와 group mapper 추가
3. `RecapListScreen`에서 로컬 로그를 세션 그룹 entry로 변환
4. `RecapListCard`에 moment count 표시 추가
5. `RecapShareScreen`에서 session recap id 해석 후 그룹 대표 공유 데이터 생성
6. 타입체크, Expo Doctor, Android/iOS/Web export 검증

## 10. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform android --output-dir .expo-export-smoke-android
npx expo export --platform ios --output-dir .expo-export-smoke-ios
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- 같은 active session에서 순간을 여러 개 저장하면 Recap 탭에 한 카드로 묶이는지 확인
- sessionId 없는 기존 로그가 개별 카드로 유지되는지 확인
- 세션 Recap 카드 클릭 시 공유 화면이 열리는지 확인
- 대표 사진/장소/음악 fallback이 깨지지 않는지 확인

## 11. Codex 계획 리뷰 및 반영

### 리뷰 결과

- 세션 전체 공유 화면을 새로 만들면 범위가 커진다. 현재 공유 화면은 단일 카드 기반이므로 대표 순간 기반으로 연결하는 것이 MVP에 적합하다.
- 세션 Recap ID와 MomentLog ID가 충돌하면 공유 화면에서 잘못된 fallback을 탈 수 있으므로 명시적 prefix가 필요하다.
- 기존 로그에는 `sessionId`가 없으므로 optional 처리와 단독 그룹 fallback이 필수다.
- 같은 세션의 여러 장소/곡을 모두 표현하려 하면 UI 범위가 커진다. 대표 로그 기준으로 시작하고, `momentCount`만 추가하는 것이 안전하다.

### 반영 사항

- `SESSION_RECAP_ID_PREFIX`를 도입한다.
- 세션 공유는 대표 로그 기반으로 유지한다.
- `sessionId` 없는 로그는 단독 그룹으로 유지한다.
- 카드에는 `momentCount`만 추가하고, 다중 장소/다중 곡 상세 표현은 후속 과제로 둔다.

## 12. Codex 코드 리뷰 및 반영

구현 후 Codex 코드 리뷰에서 다음 유지보수 이슈를 확인하고 반영했다.

- `RecapShareScreen`의 로딩 분기가 `localMomentLog` 기준으로 남아 있어, 세션 Recap처럼 `localRecap`은 존재하지만 단일 로그는 없는 케이스를 코드상 명확하게 표현하지 못했다.
- 수정: 로딩 분기를 `isLoading && !localRecap` 기준으로 바꿔 단일 로그와 세션 그룹 Recap을 동일한 로컬 Recap 경로로 처리하게 했다.

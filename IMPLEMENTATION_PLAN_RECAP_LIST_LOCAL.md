# Soundlog Recap 리스트 로컬 연동 구현 계획

## 1. 작업 목표

순간 저장 Phase 1에서 생성한 `MomentLog`를 Recap 탭에 표시하고, 각 로그를 리캡 공유 페이지로 연결한다. 사용자는 중앙 카메라 버튼으로 저장한 여행 순간을 Recap 탭에서 다시 확인하고, 해당 순간을 `Share Your Music` 카드로 저장/공유할 수 있어야 한다.

## 2. 사용자 목표

- Recap 탭에서 저장한 여행 순간 목록을 본다.
- 각 카드에서 사진, 장소, 음악, 저장 시간을 빠르게 확인한다.
- 카드를 누르면 해당 로그 기반 리캡 공유 화면으로 이동한다.
- 로컬 로그가 없어도 기존 샘플 리캡을 통해 화면 구조를 확인할 수 있다.

## 3. 범위

### 포함

- `MomentLog` → Recap 리스트 카드 변환
- `MomentLog` → `RecapShare` 변환
- Recap 탭 UI를 리스트 기반 화면으로 정리
- 로컬 로그 우선 노출, 기존 mock recap은 fallback/sample로 유지
- 로컬 사진 URI를 리캡 공유 카드 배경/디스크 이미지로 사용
- 빈 상태와 저장 CTA 제공
- web/export fallback 유지

### 제외

- 서버 Recap 생성 API
- 여행 세션 단위 그룹핑
- 앨범 커버/LP/필름/영상 템플릿 선택
- Recap 자동 생성 상태 머신
- 삭제/편집 기능
- 지도뷰

## 4. 데이터 설계

추가 유틸:

```ts
momentLogToRecapItem(log: MomentLog): RecapItem
momentLogToRecapShare(log: MomentLog): RecapShare
```

변환 규칙:

| MomentLog | RecapItem / RecapShare |
| --- | --- |
| `id` | `id` |
| `photoUri` | `backgroundImageUrl`, `discImageUrl` |
| `placeName` | `placeName`, 없으면 `위치 없음` |
| `track.title` | `trackTitle`, 없으면 `저장된 순간` |
| `track.artist` | `artistName`, 없으면 `Soundlog` |
| `createdAt` | `createdAt`, `recordedAt` |

## 5. 컴포넌트 설계

```txt
src/components/recap/
  RecapListScreen.tsx
  RecapListCard.tsx
  RecapEmptyState.tsx

src/utils/
  recapMappers.ts
```

### RecapListScreen

상태 소유:

- 로컬 `MomentLog[]`
- mock recap fallback

역할:

- 로컬 로그를 Recap 카드로 변환
- 로컬 로그가 있으면 최상단에 표시
- 카드 선택 시 `/recap-share/:id` 이동
- 로그가 없으면 카메라 CTA 표시

### RecapListCard

역할:

- 대표 이미지 썸네일
- 제목/장소/음악/시간 표시
- 누르면 공유 상세로 이동

### RecapShareScreen 연결

현재 `useRecapShareQuery`는 mock API만 사용한다. 로컬 `MomentLog` ID인 경우에는 화면 내부에서 Zustand 로그를 먼저 찾고, 찾은 로그를 `RecapShare`로 변환한다.

동작 순서:

1. `recapId`로 `momentLogStore.logs`에서 로컬 로그 검색
2. 로컬 로그가 있으면 API query 결과 대신 로컬 변환값 사용
3. 로컬 로그가 없으면 기존 mock/API query 사용

## 6. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 로컬 로그 없음 | 빈 상태 + `순간 저장하기` CTA |
| 로컬 이미지 URI가 깨짐 | 카드에 fallback 색상/아이콘 표시 |
| 로컬 로그는 있는데 track 없음 | `저장된 순간 / Soundlog` 표시 |
| 로컬 로그는 있는데 위치 없음 | `위치 없음` 표시 |
| 공유 화면에서 ID 미존재 | 기존 mock fallback 또는 empty state |
| AsyncStorage hydration 전 | mock/스켈레톤 없이 안정적으로 빈 배열 처리 |

## 7. 구현 순서

1. `recapMappers.ts` 추가
2. `RecapListCard` 추가
3. `RecapEmptyState` 추가
4. `RecapListScreen` 추가
5. `app/(tabs)/recap.tsx`를 `RecapListScreen`으로 교체
6. `RecapShareScreen`에서 로컬 MomentLog를 우선 사용하도록 연결
7. 타입체크/export 검증

## 8. 검증 계획

자동 검증:

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 검증:

- Moment Log가 없는 상태에서 Recap 탭 진입
- Moment Log 저장 후 Recap 탭 상단에 카드 표시
- 카드 터치 시 `/recap-share/:id` 이동
- 로컬 사진이 공유 카드 배경으로 표시
- track/location이 없어도 화면이 깨지지 않음

## 9. Claude 리뷰 기록

`claude_review_plan.sh IMPLEMENTATION_PLAN_RECAP_LIST_LOCAL.md` 실행 결과 Claude 사용량 제한으로 실패했다.

```txt
You've hit your limit · resets 8:10pm (Asia/Seoul)
```

따라서 이번 구현은 자체 체크리스트로 진행하고, 제한 해제 후 후속 리뷰를 받을 수 있도록 계획 파일을 유지한다.

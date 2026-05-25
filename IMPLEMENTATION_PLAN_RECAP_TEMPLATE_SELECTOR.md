# Soundlog Recap 템플릿 전환 구현 계획

## 1. 작업 목표

현재 Recap 공유 화면은 LP 형태의 단일 카드만 제공한다. 기획서에서는 Recap을 앨범 커버형, LP형, 필름형, 영상형으로 확장하는 방향을 제시하고 있으므로, 이번 단계에서는 영상 생성 이전의 MVP 범위로 **앨범/LP/필름 3가지 정적 공유 템플릿 전환 기능**을 구현한다.

사용자는 Recap 공유 화면에서 공유될 결과물의 스타일을 선택하고, 선택된 스타일 그대로 저장 또는 공유할 수 있어야 한다.

## 2. 사용자 목표

- 사용자는 Recap 공유 화면에서 하나의 여행 기록을 여러 스타일로 미리 본다.
- 앨범형은 대표 장소와 대표 음악을 강하게 보여준다.
- LP형은 기존 감성 카드 경험을 유지한다.
- 필름형은 세션 안의 여러 순간을 시간순/카드형으로 보여준다.
- 저장/공유 액션은 현재 선택된 템플릿을 캡처한다.

## 3. 기능 계약

### 진입점

- Recap 리스트 카드 선택
- `/recap-share/:id`

### 종료점

- Save 버튼으로 선택 템플릿 이미지 저장
- Share 버튼으로 선택 템플릿 이미지 공유
- 하단 탭바로 다른 화면 이동

### 영향을 받는 화면/컴포넌트

```txt
src/components/recap-share/RecapShareScreen.tsx
src/components/recap-share/RecapPreviewCard.tsx
src/components/recap-share/RecapTemplateSelector.tsx
src/types/domain.ts
src/utils/recapMappers.ts
```

### 상태 소유권

| 상태 | 위치 | 설명 |
| --- | --- | --- |
| 선택 템플릿 | `RecapShareScreen` local state | album/lp/film 중 현재 미리보기 |
| Recap 데이터 | local store 또는 TanStack Query | 기존 경로 유지 |
| 캡처 ref | `RecapShareScreen` | 선택 템플릿 렌더 결과 캡처 |

### API 기대값

이번 작업은 서버 API를 변경하지 않는다. `RecapShare` 타입만 프론트 표시용 optional 필드로 확장한다.

```ts
type RecapTemplateId = 'album' | 'lp' | 'film';

type RecapShareMoment = {
  id: string;
  imageUrl?: string;
  placeName: string;
  trackTitle: string;
  artistName: string;
  recordedAt: string;
};
```

`RecapShare.moments`는 세션 Recap에서만 채워질 수 있으며, remote mock 또는 단일 로그에서는 없어도 된다.

## 4. 범위

### 포함

- Recap 템플릿 타입 추가
- 세션 Recap 공유 데이터에 `moments` 추가
- `RecapTemplateSelector` 신규 컴포넌트 추가
- `RecapPreviewCard`를 album/lp/film 렌더링 분기로 확장
- `RecapShareScreen`에서 선택 템플릿 상태 관리
- 선택 템플릿 그대로 기존 `RecapCaptureFrame`에서 캡처
- 템플릿별 이미지/텍스트 fallback 처리

### 제외

- 영상형 Recap 생성
- 템플릿 편집 기능
- 서버 저장 템플릿 동기화
- Instagram/Snapchat 직접 공유
- 세션의 모든 사진을 고해상도 합성하는 별도 렌더러

## 5. 화면 설계

### 템플릿 선택 영역

상단 타이틀 아래, 카드 위에 pill 형태 세그먼트 컨트롤을 배치한다.

```txt
앨범 | LP | 필름
```

- 기본값은 기존 UX와 호환되는 `LP`
- 버튼은 최소 터치 영역을 확보한다.
- 선택 상태는 배경/테두리로 명확히 표시한다.

### Album 템플릿

- 대표 이미지 전체 배경
- 상단에 `SOUNDLOG`
- 중앙 또는 하단에 장소명, 대표 곡, 아티스트
- 앨범 커버형이지만 현재 캡처 프레임의 3:4 비율 안에서 표현한다.

### LP 템플릿

- 기존 `RecapPreviewCard` 스타일 유지
- 중앙 LP disc와 하단 곡 정보 중심

### Film 템플릿

- `moments`가 있으면 최대 3개 순간을 필름 프레임처럼 표시
- `moments`가 없으면 현재 Recap 1개를 단일 필름 아이템으로 fallback
- 각 아이템은 이미지, 장소, 곡 제목을 표시한다.

## 6. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 단일 Recap에 moments 없음 | film 템플릿에서 대표 Recap 1개로 fallback |
| moment 이미지 없음 | gradient fallback |
| moment track 없음 | `저장된 순간 / Soundlog` fallback |
| 긴 장소/곡명 | `numberOfLines`로 말줄임 |
| 선택 중 저장/공유 버튼 탭 | 현재 렌더된 템플릿을 그대로 캡처 |
| remote mock Recap | moments 없이 기존 대표 정보로 렌더 |

## 7. 구현 순서

1. `RecapTemplateId`, `RecapShareMoment`, `RecapShare.moments` 타입 추가
2. `momentLogGroupToRecapShare`에서 세션 로그들을 `moments`로 변환
3. `RecapTemplateSelector` 컴포넌트 추가
4. `RecapPreviewCard`에 `template` prop 추가 및 3가지 렌더 분기 구현
5. `RecapShareScreen`에서 `useState<RecapTemplateId>('lp')` 추가
6. 템플릿 선택기를 카드 위에 배치하고 `RecapPreviewCard`로 selected template 전달
7. 타입체크 및 export 검증

## 8. Codex 계획 리뷰

### 리뷰 결과

- 템플릿 선택 상태를 store에 저장하면 아직 서버/재방문 정책이 정해지지 않은 상태에서 불필요한 영속 상태가 생긴다.
- 필름형이 세션 전체를 완벽하게 합성하려고 하면 범위가 커진다. 지금은 최대 3개 순간만 보여주는 MVP가 적절하다.
- Album 템플릿의 정방형 비율을 강제하면 기존 `ViewShot` 캡처 프레임과 저장/공유 UX가 흔들릴 수 있다.
- `RecapPreviewCard`를 여러 파일로 과하게 쪼개기보다, 내부 렌더 함수로 시작하는 것이 현재 코드 규모에 맞다.

### 반영 사항

- 선택 템플릿은 `RecapShareScreen`의 로컬 state로만 관리한다.
- 캡처 프레임 비율은 기존 3:4를 유지한다.
- Film 템플릿은 최대 3개 moment preview로 제한한다.
- 신규 컴포넌트는 selector만 만들고, 템플릿 렌더링은 `RecapPreviewCard` 내부에서 처리한다.

## 9. 코드 리뷰 체크포인트

- 선택된 템플릿이 실제 캡처 대상 안에 포함되는지 확인
- 단일 Recap과 세션 Recap 모두 film fallback이 깨지지 않는지 확인
- 이미지가 없을 때 흰 화면 또는 빈 카드가 생기지 않는지 확인
- 텍스트 overflow가 카드 밖으로 나가지 않는지 확인
- 저장/공유 액션 기존 hook이 깨지지 않는지 확인

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

구현 후 Codex 코드 리뷰에서 다음 UX 일관성 이슈를 확인하고 반영했다.

- 문제: 템플릿 선택기가 로딩/에러/빈 상태에서도 노출되어, 선택할 Recap 카드가 없는 상태에서 컨트롤이 먼저 보일 수 있었다.
- 반영: `RecapTemplateSelector`를 성공 상태 분기 내부로 이동해, 실제 Recap 데이터가 있을 때만 템플릿을 선택하도록 수정했다.

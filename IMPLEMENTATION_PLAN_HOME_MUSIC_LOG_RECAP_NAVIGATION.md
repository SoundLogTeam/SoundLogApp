# Soundlog 홈 Music Log → Recap 공유 연결 구현 계획

## 1. 작업 목표

현재 홈 화면의 `Music Log` 카드는 여행 중 저장된 음악 기록을 보여주지만, 카드를 눌러 해당 기록을 다시 보거나 공유 화면으로 이동할 수 없다. Soundlog의 핵심 루프는 `순간 저장 → Music Log 확인 → Recap 공유`이므로, 이번 작업에서는 홈 Music Log 카드를 Recap 공유 화면으로 연결한다.

## 2. 사용자 목표

- 사용자는 홈의 Music Log 카드에서 저장된 순간을 탭한다.
- 로컬 순간 기록이면 해당 `MomentLog` 기반 Recap 공유 화면이 열린다.
- mock Music Log도 샘플 Recap 공유 화면으로 이동해 시연 흐름이 끊기지 않는다.
- 카드가 눌리는 요소임을 접근성/터치 피드백으로 알 수 있다.

## 3. 기능 계약

### 진입점

- 홈 화면 `Music Log` 섹션의 카드 탭

### 종료점

- `/recap-share/:id` 화면으로 이동

### 영향을 받는 파일

```txt
app/(tabs)/index.tsx
src/components/home/MusicLogSection.tsx
src/components/home/MusicLogCard.tsx
src/store/momentLogStore.ts
src/mocks/homeMocks.ts
src/mocks/recapMocks.ts
src/types/domain.ts
```

## 4. 데이터 설계

`MusicLogItem`에 공유 화면 연결용 optional 필드를 추가한다.

```ts
type MusicLogItem = {
  recapShareId?: string;
  imageUrl?: string;
};
```

정책:

- 로컬 `MomentLog`는 `recapShareId = log.id`로 변환한다.
- mock Music Log는 각 log id와 동일한 `recapShareId`를 부여하고, `recapShareById`에 대응 mock을 추가한다.
- `imageUrl`이 있으면 카드 배경으로 표시하고, 없으면 기존 밝은 카드 fallback을 유지한다.

## 5. 화면/컴포넌트 설계

### `MusicLogSection`

- `onSelectLog?: (item: MusicLogItem) => void` prop 추가
- 각 `MusicLogCard`에 선택 핸들러 전달

### `MusicLogCard`

- 기존 `View`를 `Pressable`로 변경
- `imageUrl`이 있으면 `expo-image`로 배경 표시
- 이미지 위에는 어두운 overlay를 깔아 텍스트 가독성 확보
- `onPress`가 있을 때 접근성 role/label 제공
- 기존 회전 스타일 유지

### Home

- `handleSelectMusicLog`에서 `item.recapShareId ?? item.id`로 `/recap-share/:id` 이동

## 6. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 로컬 로그에 사진 있음 | 사진을 카드 배경과 Recap 공유 배경으로 사용 |
| mock 로그 | `recapShareById` mock 데이터로 공유 화면 표시 |
| recapShareId 없음 | `item.id`를 fallback으로 사용 |
| 이미지 없음 | 기존 밝은 카드 스타일 유지 |
| 긴 장소/곡명 | `numberOfLines` 유지 |

## 7. Codex 계획 리뷰

### 리뷰 결과

- 홈에서 Music Log가 눌리지 않으면 저장된 순간을 다시 보는 루프가 끊긴다. 이 작업은 작은 범위지만 사용 흐름상 가치가 높다.
- `MusicLogItem.id`만 사용하면 mock id와 local moment id가 섞여도 현재 API fallback 때문에 의도치 않게 같은 Recap으로 열릴 수 있다.
- 카드 배경 이미지를 추가하면 로컬 사진 저장의 결과가 홈에서 바로 보이므로 기능 피드백이 더 강해진다.
- 다만 모든 샘플 로그를 서버처럼 과하게 모델링할 필요는 없고, mock share entry만 추가하면 충분하다.

### 반영 사항

- `recapShareId`를 명시적으로 추가한다.
- mock Music Log 각각에 대응하는 `recapShareById`를 추가한다.
- `imageUrl`이 있는 카드만 이미지 배경을 사용하고, 없으면 기존 fallback을 유지한다.
- 라우팅은 홈에서만 소유하고 카드/섹션은 콜백만 받는다.

## 8. 구현 순서

1. `MusicLogItem` 타입에 `recapShareId`, `imageUrl` optional 필드 추가
2. `momentLogToMusicLogItem`에 로컬 로그 id/photoUri 매핑 추가
3. mock `recentMusicLogs`에 `recapShareId`, `imageUrl` 추가
4. `recapShareById`에 mock log별 공유 데이터 추가
5. `MusicLogSection`에 `onSelectLog` prop 추가
6. `MusicLogCard`를 Pressable + 이미지 fallback 카드로 개선
7. 홈에서 Music Log 탭 시 `/recap-share/:id` 이동

## 9. 코드 리뷰 체크포인트

- 카드 탭이 로컬 MomentLog와 mock log 모두 열리는지 확인
- 이미지 없는 카드 fallback이 깨지지 않는지 확인
- Pressable 접근성 label이 의미 있게 들어가는지 확인
- 섹션이 `onSelectLog` 없이도 재사용 가능한지 확인
- 기존 Music Log 로딩/빈/에러 상태가 유지되는지 확인

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

구현 후 Codex 코드 리뷰에서 다음 시연 안정성 이슈를 확인하고 반영했다.

- 문제: mock Music Log와 Recap 공유 데이터에 `http://tong.visitkorea.or.kr` 이미지 URL이 포함되어 있어 iOS/Web 환경에서 이미지 로딩이 제한될 수 있다.
- 반영: 동일한 관광공사 이미지 경로를 `https://tong.visitkorea.or.kr`로 변경해 플랫폼별 이미지 로딩 실패 가능성을 낮췄다. 같은 위험이 남지 않도록 playlist/tour mock 이미지 URL도 함께 정리했다.

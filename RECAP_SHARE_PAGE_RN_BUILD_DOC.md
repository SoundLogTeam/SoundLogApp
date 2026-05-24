# Soundlog 리캡 공유 페이지 제작 문서

## 1. 문서 목적

이 문서는 Figma의 `Music log` 화면 중 리캡 공유 페이지를 React Native 기반 Soundlog 앱에서 구현하기 위한 제작 기준서이다.

Figma 기준 화면은 사용자가 여행 중 저장한 음악 로그를 하나의 공유 가능한 앨범/LP 카드로 보여주고, Instagram, Snapchat, Messages, Save, Share 액션을 제공하는 화면이다.

---

## 2. 화면 역할

리캡 공유 페이지는 여행 또는 특정 음악 로그를 SNS에 공유 가능한 시각 콘텐츠로 보여주는 화면이다.

이 화면의 핵심 목적은 다음과 같다.

1. 여행 음악 기록을 하나의 감성적인 카드로 보여준다.
2. 장소, 대표 곡, 아티스트, 시간 정보를 명확하게 담는다.
3. 사용자가 저장 또는 공유를 쉽게 실행할 수 있게 한다.
4. 공유 전 결과물이 어떻게 보일지 미리 확인하게 한다.

---

## 3. Figma 화면 요약

| 영역 | 내용 |
| --- | --- |
| 타이틀 | `Share Your Music` |
| 중앙 리캡 카드 | 서울 야경 이미지 기반 LP/앨범 카드 |
| 카드 정보 | `Seoul`, `Seoul City`, `JENNIE` |
| 날짜/시간 | `2024/4/24 | 6:20 PM` |
| 공유 액션 | Instagram, Snapchat, Messages, Save, Share |
| 하단 탭바 | 홈, 위치, 카메라, 좋아요, 마이 |

---

## 4. RN 구현 방향 요약

Figma는 정적인 공유 미리보기 화면이다. RN에서는 다음 구조로 구현한다.

```txt
RecapShareScreen
  SafeAreaView
    HeaderTitle
    RecapPreviewCard
    RecordedAtText
    ShareActionList
  BottomTabBar fixed
```

### 구현 원칙

- 중앙 리캡 카드는 고정 비율로 만든다.
- 공유용 이미지를 실제로 생성할 수 있도록 카드 영역을 캡처 가능하게 설계한다.
- 공유 액션은 네이티브 공유 기능과 앱별 딥링크를 구분한다.
- MVP에서는 Instagram/Snapchat 직접 공유보다 OS 기본 공유 시트를 우선 구현한다.
- Save는 기기 갤러리에 이미지 저장을 의미한다.

---

## 5. 레이아웃 명세

### 5.1 화면 루트

| 속성 | 값 |
| --- | --- |
| 기준 화면 | 390 x 844 |
| 배경 | 어두운 네이비/브라운/퍼플 그라데이션 |
| 상단 타이틀 위치 | 약 118px |
| 카드 크기 | 약 300 x 400 |
| 카드 radius | 20 |
| 공유 버튼 위치 | 카드 하단, 날짜 아래 |

### 5.2 배경

Figma 배경은 어두운 그라데이션과 중앙 glow가 있다. RN에서는 다음 방식으로 구현한다.

- `expo-linear-gradient`로 전체 배경 구성
- 중앙 glow는 후순위
- 카드 자체가 강한 시각 중심이므로 배경 장식은 과하게 만들지 않는다.

권장 색상:

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `background.primary` | `#050916` | 기본 배경 |
| `background.deepPurple` | `#160F27` | 그라데이션 |
| `background.brownGlow` | `#2C1B33` | 보조 그라데이션 |
| `text.primary` | `#FFFFFF` | 타이틀 |
| `text.secondary` | `#C1C1C1` | 날짜/시간 |

---

## 6. 섹션별 제작 명세

## 6.1 HeaderTitle

### 역할

현재 화면이 공유 화면임을 명확히 보여준다.

### 표시 문구

Figma:

```txt
Share Your Music
```

서비스 한국어 버전 권장:

```txt
음악 기록 공유하기
```

또는 글로벌 톤을 유지하려면 Figma 문구 그대로 사용한다.

### 스타일

```txt
text-white text-[24px] font-semibold text-center
```

---

## 6.2 RecapPreviewCard

### 역할

공유될 결과물을 미리 보여주는 핵심 영역이다.

### Figma 기준 요소

- 카드 크기: `300 x 400`
- 카드 radius: `20`
- 배경 이미지: 서울 야경
- 상단 장소명: `Seoul`
- 중앙 LP 형태 마스크 이미지
- 중앙 원형 hole
- 하단 곡 제목: `Seoul City`
- 하단 아티스트: `JENNIE`

### RN 구현 방식

LP 형태를 완벽히 구현하려면 마스크 처리가 필요하다. RN MVP에서는 다음 순서로 접근한다.

1. 카드 전체 배경 이미지를 먼저 구현한다.
2. 중앙에 원형 앨범/LP 이미지를 겹친다.
3. 가운데 원형 hole을 어두운 원으로 배치한다.
4. 상단/하단 텍스트를 absolute로 배치한다.

### 컴포넌트 구조

```txt
RecapPreviewCard
  ImageBackground
  DarkOverlay
  Text placeName
  RecordDisc
    DiscImage
    CenterHole
  TrackInfo
    TrackTitle
    ArtistName
```

### 카드 데이터 타입

```ts
type RecapShare = {
  id: string;
  placeName: string;
  trackTitle: string;
  artistName: string;
  imageUrl: string;
  recordedAt: string;
  shareImageUrl?: string;
};
```

### 스타일 기준

```txt
w-[300px] h-[400px] rounded-[20px] overflow-hidden
```

이미지는 `contentFit="cover"`를 사용한다.

### 캡처 가능 영역

공유 이미지 생성을 위해 `RecapPreviewCard`는 `ViewShot` 또는 서버 생성 이미지의 기준 영역이 된다.

MVP 선택지:

| 방식 | 설명 | 권장 |
| --- | --- | --- |
| 클라이언트 캡처 | `react-native-view-shot`으로 카드 View 캡처 | 빠른 MVP에 적합 |
| 서버 이미지 생성 | 서버에서 최종 공유 이미지 렌더링 | 품질/일관성은 좋지만 개발량 증가 |

권장 MVP:

```txt
react-native-view-shot 기반 클라이언트 캡처
```

---

## 6.3 RecordedAtText

### 역할

기록된 날짜와 시간을 보여준다.

### Figma 문구

```txt
2024/4/24 | 6:20 PM
```

### 데이터 처리

앱 내부에서는 ISO string으로 저장하고, 화면에서 포맷팅한다.

```ts
type RecordedAt = string; // ISO date string
```

권장 포맷:

```txt
YYYY/M/D | h:mm A
```

한국어 설정일 경우:

```txt
2024. 4. 24. 오후 6:20
```

---

## 6.4 ShareActionList

### 역할

사용자가 리캡 카드를 저장하거나 외부 앱으로 공유할 수 있게 한다.

### Figma 기준 액션

```txt
Instagram / Snapchat / Messages / Save / Shar
```

`Shar`는 디자인상 잘린 것으로 보고 실제 구현에서는 `Share`로 수정한다.

### RN 구현 권장

가로 스크롤 액션 리스트로 구현한다.

```txt
ShareActionList
  ShareActionButton Instagram
  ShareActionButton Snapchat
  ShareActionButton Messages
  ShareActionButton Save
  ShareActionButton More
```

### 액션 정책

| 액션 | MVP 동작 | 후속 고도화 |
| --- | --- | --- |
| Instagram | 기본 공유 시트 호출 | Instagram Stories 딥링크 |
| Snapchat | 기본 공유 시트 호출 | Snapchat 딥링크 |
| Messages | 기본 공유 시트 호출 | 메시지 앱 직접 호출 |
| Save | 이미지 캡처 후 갤러리 저장 | 저장 완료 토스트 |
| Share | OS 기본 공유 시트 호출 | 공유 채널별 이벤트 분석 |

### 필요한 라이브러리 후보

| 목적 | 후보 |
| --- | --- |
| 공유 | `expo-sharing` |
| 미디어 저장 | `expo-media-library` |
| 카드 캡처 | `react-native-view-shot` |
| 파일 처리 | `expo-file-system` |

Expo 기반 MVP에서는 `expo-sharing`, `expo-media-library`, `expo-file-system`을 우선 검토한다.

---

## 6.5 BottomTabBar

리캡 공유 페이지에서도 하단 탭바는 공통 컴포넌트를 재사용한다.

다만 공유 페이지는 집중도가 중요한 화면이므로 다음 정책 중 하나를 정해야 한다.

| 정책 | 설명 |
| --- | --- |
| 탭바 유지 | 현재 Figma처럼 앱 구조 일관성 유지 |
| 탭바 숨김 | 공유 결과물에 집중, 뒤로가기/닫기 제공 |

Figma 기준은 탭바 유지이다. MVP에서는 탭바 유지로 구현한다.

---

## 7. 상태 정의

### 7.1 Route Params

```ts
type RecapShareRouteParams = {
  recapId?: string;
  momentLogId?: string;
};
```

### 7.2 Query 상태

```txt
useRecapShareQuery
useSaveRecapImageMutation
useShareRecapMutation
```

### 7.3 Local 상태

```ts
type RecapShareScreenState = {
  isCapturing: boolean;
  isSaving: boolean;
  isSharing: boolean;
  selectedShareTarget?: 'instagram' | 'snapchat' | 'messages' | 'save' | 'share';
};
```

---

## 8. API 계약 초안

### 8.1 공유용 리캡 조회

```txt
GET /v1/recaps/:recapId/share
```

응답:

```ts
type RecapShareResponse = {
  recap: RecapShare;
};
```

### 8.2 공유 이벤트 기록

```txt
POST /v1/events/recap-share
```

요청:

```ts
type RecapShareEventRequest = {
  recapId: string;
  target: 'instagram' | 'snapchat' | 'messages' | 'save' | 'share';
  success: boolean;
};
```

---

## 9. NativeWind 스타일 기준

### 9.1 Screen

```txt
flex-1 bg-[#050916]
```

Gradient 사용:

```tsx
<LinearGradient colors={['#050916', '#160F27', '#2C1B33']} />
```

### 9.2 Title

```txt
text-white text-[24px] font-semibold text-center
```

### 9.3 RecapCard

```txt
w-[300px] h-[400px] rounded-[20px] overflow-hidden self-center
```

### 9.4 PlaceName

```txt
absolute left-5 top-6 text-white text-[16px] font-semibold
```

### 9.5 TrackTitle

```txt
absolute left-5 bottom-10 text-white text-[22px] font-semibold
```

### 9.6 ArtistName

```txt
absolute left-5 bottom-6 text-white text-[12px]
```

### 9.7 ShareActionButton

```txt
items-center gap-2 w-[72px]
```

아이콘 원:

```txt
w-[54px] h-[54px] rounded-full items-center justify-center
```

---

## 10. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 리캡 로딩 | 카드 스켈레톤 |
| 리캡 없음 | “공유할 음악 기록을 찾을 수 없어요” |
| 이미지 로딩 실패 | 기본 도시 야경 fallback |
| 카드 캡처 실패 | 다시 시도 안내 |
| 갤러리 저장 권한 없음 | 권한 요청 및 설정 이동 |
| 공유 취소 | 에러로 보지 않고 조용히 닫기 |
| 공유 실패 | 토스트 + 다시 시도 |

---

## 11. 저장/공유 플로우

### 11.1 Save

1. 사용자가 Save 탭
2. RecapPreviewCard 캡처
3. 사진 저장 권한 확인
4. 갤러리에 저장
5. 저장 완료 토스트
6. 공유 이벤트 기록

### 11.2 Share

1. 사용자가 Share 또는 특정 앱 탭
2. RecapPreviewCard 캡처
3. 임시 파일 생성
4. OS 공유 시트 호출
5. 성공/취소 결과에 따라 이벤트 기록

---

## 12. MVP 구현 순서

1. 정적 RecapShareScreen 레이아웃 구현
2. RecapPreviewCard 더미 데이터 연결
3. LP 형태 카드 구현
4. 날짜/시간 포맷팅
5. ShareActionList 구현
6. BottomTabBar 공통 컴포넌트 연결
7. `ViewShot` 기반 카드 캡처 적용
8. Save 기능 연결
9. 기본 Share 기능 연결
10. API 연동
11. 공유 이벤트 기록

---

## 13. 개발 체크리스트

- 중앙 카드가 작은 화면에서 잘리지 않는가?
- 카드 비율이 공유 이미지로 저장해도 유지되는가?
- 카드 내부 텍스트가 이미지와 충분히 대비되는가?
- Save/Share 중복 탭을 막는가?
- 저장 권한 거부 시 안내가 자연스러운가?
- 공유 취소를 실패처럼 보여주지 않는가?
- 탭바가 공유 액션 리스트와 겹치지 않는가?

---

## 14. 최종 구현 방향

리캡 공유 페이지는 Soundlog의 감성 결과물을 사용자 밖으로 확산시키는 화면이다. 단순히 예쁜 카드가 아니라, 사용자가 “이건 공유하고 싶다”고 느끼는 완성도와 저장/공유의 안정성이 중요하다.

MVP에서는 카드 미리보기, 저장, OS 기본 공유를 우선 구현하고, Instagram Stories나 Snapchat 직접 공유, 영상 리캡 공유, 템플릿 변경 기능은 후속 단계로 확장한다.

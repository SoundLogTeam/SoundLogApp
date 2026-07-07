# Soundlog RN Design System

이 문서는 현재 구현된 React Native/Expo 앱의 실제 스타일을 기준으로 만든 디자인 시스템입니다. 새 화면을 만들 때는 먼저 `src/design-system`과 이 문서의 레시피를 조립하고, 새 색상이나 새 컴포넌트는 기존 패턴으로 표현하기 어려울 때만 추가합니다.

## Design Direction

- Soundlog는 어두운 앱 배경 위에 음악 카드, 여행 상태, Recap을 겹겹이 올리는 구조입니다.
- 기본 화면은 `#070B1F`, 카드와 컨트롤은 `#080D18`, `#090E1B`, `#171B2A` 계열을 사용합니다.
- 선택 상태와 핵심 CTA는 라임 `#B7E628`입니다. 라임은 "지금 선택됨", "여행 시작", "Recap 보기"처럼 행동이 분명한 곳에 씁니다.
- 파랑은 일상 모드나 보조 정보, 골드는 특별한 음악/Recap 강조, 보라색은 브랜드 로고 중심으로 제한합니다.
- 앱 기본 표면에는 장식용 그라데이션, 새 폰트, 과한 네온 효과를 추가하지 않습니다. 현재 앱의 Recap 이미지, 플레이어, 미디어 fallback처럼 콘텐츠를 표현하는 곳에서만 제한적으로 씁니다.
- UI는 둥근 칩, 둥근 카드, 높은 대비 텍스트, 44px 이상 터치 영역을 기본으로 합니다.

## Code Entry

```ts
import {
  AppText,
  BrandLogo,
  Chip,
  IconButton,
  Screen,
  soundlogDesignTokens,
  soundlogRecipes,
} from '@/design-system';
```

`src/design-system/index.ts`는 새 컴포넌트를 다시 만드는 곳이 아니라, 현재 RN 앱에 구현된 컴포넌트와 스타일 recipe를 일관되게 꺼내 쓰는 조립 지점입니다. 토큰 원천은 `src/constants/colors.ts`와 `tailwind.config.js`입니다.

## Source Of Truth

이 디자인 시스템은 HTML 와이어프레임이나 신규 기획 문서의 시안을 기준으로 하지 않습니다. 기준은 현재 RN 앱에 이미 구현된 화면입니다.

| Area | Current Source |
| --- | --- |
| 기본 화면 배경과 safe area | `src/components/Screen.tsx` |
| 텍스트 래퍼 | `src/components/AppText.tsx` |
| 필터/태그 칩 | `src/components/Chip.tsx` |
| 상단 로고와 모드 세그먼트 | `src/components/home/HomeHeader.tsx` |
| 추천 플레이리스트 카드 | `src/components/home/FeaturedPlaylistCard.tsx` |
| 여행 상태 카드 | `src/components/travel/TravelStatusCard.tsx` |
| Recap 리스트 카드 | `src/components/recap/RecapListCard.tsx` |
| 라이브 사운드맵 | `src/components/travel/live-sound-map/LiveSoundMapSection.tsx` |

## Color Tokens

| Role | Value | NativeWind |
| --- | --- | --- |
| App background | `#070B1F` | `bg-soundlog-bg` |
| Raised background | `#0B102A` | `bg-soundlog-bg2` |
| Card | `#080D18` | `bg-soundlog-card` |
| Elevated card | `#090E1B` | `bg-soundlog-elevated` |
| Chip | `#171B2A` | `bg-soundlog-chip` |
| Selected / CTA | `#B7E628` | `bg-soundlog-selected`, `bg-soundlog-lime` |
| Focus border | `#B7E628` | `border-soundlog-focus` |
| Chip border | `#364283` | `border-soundlog-border` |
| Info blue | `#6EA8FF` | `text-soundlog-blue` |
| Accent purple | `#7A2CFF` | `text-soundlog-purple` |
| Accent gold | `#B1913A` | `text-soundlog-gold` |
| Warning action | `#FF8A3D` | `bg-soundlog-warning` |
| Inverse text | `#090515` | `text-soundlog-inverse` |

## Typography

| Use | Current Pattern |
| --- | --- |
| Screen title | `text-[28px] font-semibold text-white` |
| Hero card title | `text-[30px] font-semibold leading-9 text-white` |
| Section title | `text-[22px] font-semibold text-white` |
| Card title | `text-[18px] font-bold leading-6 text-white` |
| Body | `text-sm leading-6 text-white/60` |
| Caption | `text-xs text-white/45` |
| Chip label | `text-[13px] font-medium` |

항상 `AppText`를 먼저 사용합니다. 카드, 리스트, 작은 탭처럼 폭이 제한된 영역은 `numberOfLines`를 지정해서 텍스트가 카드 밖으로 밀려나지 않게 합니다.

## Radius And Spacing

| Use | Current Pattern |
| --- | --- |
| Screen horizontal padding | `px-5` |
| Section gap | `mt-4`, `mt-5`, `gap-4` 중심 |
| Icon button | `h-11 w-11 rounded-full` |
| Default chip | `min-h-[38px] rounded-full px-5` |
| Small chip | `min-h-[28px] rounded-full px-3` |
| Compact card | `rounded-[12px]` |
| Metric card | `rounded-[14px]`, `rounded-[18px]` |
| Mode control | `rounded-[20px]` + inner `rounded-full` |
| Active travel card | `rounded-[22px]` |
| Ended/idle travel cards | `rounded-[28px]`, `rounded-[30px]` |

새 화면의 카드 radius는 먼저 18, 20, 22 중에서 고릅니다. 화면을 대표하는 큰 상태 카드는 28 또는 30까지 허용합니다.

## Primitive Components

### Screen

`Screen`은 앱 배경과 safe area를 고정합니다.

```tsx
<Screen contentClassName="px-5 pt-4">
  <HomeNavigationBar />
</Screen>
```

### AppText

모든 텍스트의 기본 래퍼입니다.

```tsx
<AppText className="text-[22px] font-semibold text-white">오늘의 추천</AppText>
```

### BrandLogo

현재 앱 로고 이미지를 원형으로 표시합니다.

```tsx
<BrandLogo className="border border-white/25" size={32} />
```

### Chip

필터, 태그, 작은 메타 정보에 씁니다. 선택 상태는 라임 배경과 inverse text로 처리합니다.

```tsx
<Chip label="여행 모드" selected />
<Chip label="12곡" size="small" />
```

### IconButton

상단 액션, 닫기, 공유 같은 아이콘 액션에 씁니다. 접근성 label은 필수입니다.

```tsx
<IconButton label="설정 열기" name="settings" onPress={openSettings} />
```

### EmptyState

비어 있음, 권한 전, 데이터 없음 상태에 씁니다. 새 화면에서 빈 상태 문구와 CTA를 임의 스타일로 만들지 말고 이 컴포넌트를 먼저 씁니다.

## Class Recipes

반복되는 NativeWind class 조합은 `soundlogRecipes`에서 꺼내 씁니다. recipe는 현재 앱 스타일의 이름표일 뿐이고, 화면마다 필요한 state/접근성 props는 컴포넌트에서 직접 명시합니다.

```tsx
import { AppText, soundlogRecipes } from '@/design-system';

<View className={soundlogRecipes.card.glass}>
  <AppText className={soundlogRecipes.text.sectionTitle}>주변 사운드</AppText>
</View>
```

자주 쓰는 recipe:

| Recipe | Role |
| --- | --- |
| `screen.content` | `px-5 pt-4` 기본 화면 안쪽 여백 |
| `card.glass` | 여행/상태성 카드의 흰색 10% 표면 |
| `card.media` | Recap처럼 이미지/미디어가 중심인 카드 |
| `button.primary` | 56px 라임 CTA |
| `button.icon` | 44px 원형 아이콘 버튼 |
| `control.segmentedShell` | 홈 모드 세그먼트 바깥 컨테이너 |
| `travel.activeCard` | 여행 진행 중 카드 |
| `recap.listCard` | Recap 리스트 카드 |

## Screen Recipes

### Standard App Screen

```tsx
<Screen contentClassName="px-5 pt-4">
  <HomeNavigationBar />
  <AppText className="mt-6 text-[28px] font-semibold text-white">Library</AppText>
  <View className="mt-5 gap-4">{children}</View>
</Screen>
```

### Segmented Mode Control

홈의 `HomeHeader` 패턴을 재사용합니다.

- 바깥 컨테이너: `rounded-[20px] bg-soundlog-elevated/80 p-2`
- 안쪽 트랙: `rounded-full bg-black/25 p-1`
- 선택 탭: 일상 모드는 blue, 여행 모드는 lime
- 선택 탭 text: `text-soundlog-inverse`

### Filter Bar

`HomeTopFilterBar`처럼 pill 컨테이너 안에 `Chip`을 가로 스크롤로 배치합니다.

- 컨테이너: `rounded-full border border-soundlog-border/70 bg-soundlog-chip/70 py-2 pl-2`
- 칩 간격: `gap-2`
- 끝 여백: `pr-5`

### Music Card

`FeaturedPlaylistCard`와 `MoodRecommendationCard`가 기준입니다.

- 추천 플레이리스트: `h-[260px] w-[180px] rounded-[20px] border border-white/10 bg-soundlog-card p-4`
- 무드 카드: `h-[136px] w-[136px] rounded-[12px] p-5`
- 제목은 1-2줄 제한, 설명은 1-2줄 제한을 기본으로 둡니다.

### Travel Status

`TravelStatusCard`를 기준으로 여행 진행 상태를 표현합니다.

- active: 라임 border, 라임 status dot, compact metric, 음악 row, 44px CTA
- ended: 28 radius card, metric grid, 56px primary CTA
- idle: 30 radius card, 라임 원형 아이콘, 큰 시작 CTA

### Recap And Share

Recap은 앱에서 가장 감성적인 영역이지만, 기본 표면 규칙은 유지합니다.

- 리스트 카드는 이미지 또는 fallback 콘텐츠가 중심이고 텍스트는 흰색/60 이하 보조 텍스트로 정리합니다.
- 공유 액션은 `ShareActionButton`, `ShareActionList`를 먼저 조립합니다.
- Recap 미리보기는 `RecapPreviewCard`를 기준으로 템플릿만 바꿉니다.
- 스포티파이 그린, 이미지 fallback, Recap 장식색처럼 콘텐츠나 외부 브랜드가 명확한 색은 해당 컴포넌트 안에서만 제한적으로 유지합니다.

## Do

- `bg-soundlog-*`, `text-white/*`, `border-white/*` 토큰을 우선 사용합니다.
- 선택/확정/시작 액션에는 라임을 씁니다.
- 아이콘 버튼은 `IconButton` 또는 같은 44px 원형 패턴을 유지합니다.
- 긴 제목, 위치명, 곡명은 `numberOfLines`로 줄 수를 제한합니다.
- 리스트 row와 카드에는 `min-w-0`을 사용해 텍스트 overflow를 막습니다.

## Don't

- 일반 배경이나 카드에 새 장식 그라데이션을 만들지 않습니다.
- 새 폰트나 과한 letter spacing을 추가하지 않습니다.
- 라임을 모든 장식 요소에 뿌리지 않습니다. 라임은 상태와 행동의 언어입니다.
- 카드 안에 또 다른 큰 장식 카드를 중첩하지 않습니다.
- 44px 미만의 터치 버튼을 만들지 않습니다.
- `#FFFFFF` 카드, 베이지 배경, 보라-파랑 랜딩 페이지 톤을 앱 화면에 새로 들여오지 않습니다.

## Design QA Checklist

- 새 화면의 최상위가 `Screen`인지 확인합니다.
- 새 색상이 필요하면 먼저 `src/constants/colors.ts`, `tailwind.config.js`, `soundlogDesignTokens`에 들어갈 역할 이름을 정합니다.
- 주요 CTA가 하나만 강하게 보이는지 확인합니다.
- iPhone SE 폭에서도 버튼 텍스트와 카드 제목이 넘치지 않는지 확인합니다.
- 탭, 칩, 아이콘 버튼의 접근성 role/label/selected 상태를 확인합니다.
- 로딩, 비어 있음, 실패, 권한 없음 상태가 `EmptyState` 또는 기존 state component로 표현되는지 확인합니다.
- 디자인 리뷰 때는 실제 RN 앱 스크린샷 기준으로 비교합니다. HTML 와이어프레임은 참고 자료이고, 최종 앱 스타일의 기준은 이 RN 디자인 시스템입니다.

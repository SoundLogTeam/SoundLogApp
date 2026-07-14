# Soundlog RN Design System

이 문서는 현재 구현된 React Native/Expo 앱의 실제 스타일을 기준으로 만든 디자인 시스템입니다. 새 화면을 만들 때는 먼저 `src/design-system`과 이 문서의 레시피를 조립하고, 새 색상이나 새 컴포넌트는 기존 패턴으로 표현하기 어려울 때만 추가합니다.

## Design Direction

- Soundlog는 어두운 앱 배경 위에 페이지 제목, 라임 섹션 제목, 평평한 설정/정보 행이 이어지는 구조입니다.
- 기본 화면은 `#070B1F`, 카드와 컨트롤은 `#080D18`, `#090E1B`, `#171B2A` 계열을 사용합니다.
- 선택 상태와 핵심 CTA는 라임 `#B7E628`입니다. 라임은 "지금 선택됨", "여행 시작", "Recap 보기"처럼 행동이 분명한 곳에 씁니다.
- 파랑은 일상 모드나 보조 정보, 골드는 특별한 음악/Recap 강조, 보라색은 브랜드 로고 중심으로 제한합니다.
- 앱 기본 표면에는 장식용 그라데이션, 새 폰트, 과한 네온 효과를 추가하지 않습니다. 현재 앱의 Recap 이미지, 플레이어, 미디어 fallback처럼 콘텐츠를 표현하는 곳에서만 제한적으로 씁니다.
- 일반 정보와 설정은 카드로 감싸지 않습니다. 카드는 앨범 이미지, Recap 공유 결과물, 지도, 반복 미디어 항목, 모달처럼 경계가 실제로 필요한 경우에만 씁니다.
- 칩과 세그먼트 컨트롤은 옵션 선택에만 사용하고, 모든 터치 영역은 44px 이상을 유지합니다.

## Code Entry

```ts
import {
  AppText,
  BrandLogo,
  Chip,
  IconButton,
  PageHeader,
  Screen,
  SectionTitle,
  SettingsRow,
  SoundlogButton,
  SoundlogMetric,
  SoundlogSectionHeader,
  SoundlogSurface,
  soundlogDesignTokens,
  soundlogRecipes,
} from '@/design-system';
```

`src/design-system/index.ts`는 새 컴포넌트를 다시 만드는 곳이 아니라, 현재 RN 앱에 구현된 컴포넌트와 스타일 recipe를 일관되게 꺼내 쓰는 조립 지점입니다. 토큰 원천은 `src/constants/colors.ts`와 `tailwind.config.js`입니다. 새 일반 화면은 `PageHeader`, `SectionTitle`, `SettingsRow`, `IconButton`을 우선하고, `SoundlogSurface`와 `SoundlogMetric`은 기존 미디어·모달 화면 호환용으로만 사용합니다.

## Source Of Truth

이 디자인 시스템은 HTML 와이어프레임이나 신규 기획 문서의 시안을 기준으로 하지 않습니다. 기준은 현재 RN 앱에 이미 구현된 화면입니다.

| Area                       | Current Source                                                 |
| -------------------------- | -------------------------------------------------------------- |
| 기본 화면 배경과 safe area | `src/components/Screen.tsx`                                    |
| 텍스트 래퍼                | `src/components/AppText.tsx`                                   |
| 기본 페이지 제목           | `src/components/PageHeader.tsx`                                |
| 라임 섹션 제목             | `src/components/SectionTitle.tsx`                              |
| 설정/정보 행               | `src/components/SettingsRow.tsx`                               |
| 평평한 화면 조립 기준      | `app/(tabs)/my.tsx`                                            |
| 필터/태그 칩               | `src/components/Chip.tsx`                                      |
| 상단 로고와 모드 세그먼트  | `src/components/home/HomeHeader.tsx`                           |
| 추천 플레이리스트 카드     | `src/components/home/FeaturedPlaylistCard.tsx`                 |
| 여행모드 화면              | `src/components/travel/TravelScreen.tsx`                       |
| 로그 격자                  | `src/components/recap/RecapListScreen.tsx`                     |
| 지도 리캡 클러스터         | `src/components/travel/recap-map/RecapMapSection.tsx`          |
| 라이브 사운드맵            | `src/components/travel/live-sound-map/LiveSoundMapSection.tsx` |
| 조립용 프리미티브          | `src/design-system/primitives.tsx`                             |

## Color Tokens

| Role              | Value     | NativeWind                                 |
| ----------------- | --------- | ------------------------------------------ |
| App background    | `#070B1F` | `bg-soundlog-bg`                           |
| Raised background | `#0B102A` | `bg-soundlog-bg2`                          |
| Card              | `#080D18` | `bg-soundlog-card`                         |
| Elevated card     | `#090E1B` | `bg-soundlog-elevated`                     |
| Chip              | `#171B2A` | `bg-soundlog-chip`                         |
| Selected / CTA    | `#B7E628` | `bg-soundlog-selected`, `bg-soundlog-lime` |
| Focus border      | `#B7E628` | `border-soundlog-focus`                    |
| Chip border       | `#364283` | `border-soundlog-border`                   |
| Info blue         | `#6EA8FF` | `text-soundlog-blue`                       |
| Accent purple     | `#7A2CFF` | `text-soundlog-purple`                     |
| Accent gold       | `#B1913A` | `text-soundlog-gold`                       |
| Warning action    | `#FF8A3D` | `bg-soundlog-warning`                      |
| Inverse text      | `#090515` | `text-soundlog-inverse`                    |

## Typography

| Use             | Current Pattern                                  |
| --------------- | ------------------------------------------------ |
| Screen title    | `text-[30px] font-semibold leading-9 text-white` |
| Hero card title | `text-[30px] font-semibold leading-9 text-white` |
| Section title   | `text-[20px] font-semibold text-soundlog-lime`   |
| Row label       | `text-[15px] font-medium text-white/88`          |
| Media title     | `text-[18px] font-semibold leading-6 text-white` |
| Body            | `text-sm leading-6 text-white/60`                |
| Caption         | `text-xs text-white/45`                          |
| Chip label      | `text-[13px] font-medium`                        |

항상 `AppText`를 먼저 사용합니다. 카드, 리스트, 작은 탭처럼 폭이 제한된 영역은 `numberOfLines`를 지정해서 텍스트가 카드 밖으로 밀려나지 않게 합니다.

## Radius And Spacing

| Use                       | Current Pattern                         |
| ------------------------- | --------------------------------------- |
| Screen horizontal padding | `px-5`                                  |
| Section gap               | `mt-7` 중심                              |
| Icon button               | `h-11 w-11 rounded-full`                |
| Settings row              | `min-h-[52px] py-2`                     |
| Default chip              | `min-h-[38px] rounded-full px-5`        |
| Small chip                | `min-h-[28px] rounded-full px-3`        |
| Repeated media card       | `rounded-lg`                            |
| Input / primary command   | `rounded-xl`                            |
| Segmented control         | outer/inner `rounded-full`              |
| Recap share artwork       | template-specific                       |

새 화면은 먼저 카드가 필요한지 판단합니다. 단순 제목, 설명, 값, 이동 액션은 `SettingsRow`로 표현하고 배경 카드나 테두리를 추가하지 않습니다. 카드가 필요한 반복 미디어 항목은 기본 `rounded-lg`를 사용하며, Recap 공유 결과물은 템플릿 표현을 위해 별도 반경을 허용합니다.

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

### PageHeader

일반 페이지의 30px 제목입니다. 뒤로가기나 우측 명령은 아이콘/텍스트 슬롯으로 전달합니다.

```tsx
<PageHeader
  leftContent={<IconButton label="뒤로가기" name="arrow-left" onPress={goBack} />}
  title="보관함"
/>
```

### SectionTitle

페이지 안의 작업 단위를 20px 라임 제목으로 구분합니다. 일반 페이지에서 작은 eyebrow나 카드 제목을 새로 만들지 않습니다.

```tsx
<SectionTitle title="저장한 음악" />
```

### SettingsRow

설정뿐 아니라 장소, 음악, 이동 거리, 오류 재시도처럼 `label + value/description + action` 구조인 정보를 표현합니다.

```tsx
<SettingsRow
  description="현재 장소에 맞는 음악 추천"
  icon="map-pin"
  label="위치"
  rightText="허용됨"
/>
```

### EmptyState

비어 있음, 권한 전, 데이터 없음 상태에 씁니다. 새 화면에서 빈 상태 문구와 CTA를 임의 스타일로 만들지 말고 이 컴포넌트를 먼저 씁니다.

## Composable Primitives

프리미티브는 새 화면을 빠르게 조립하기 위한 얇은 컴포넌트입니다. 기존 화면을 강제로 갈아엎기 위한 레이어가 아니라, 앞으로 추가되는 화면에서 반복 className 복붙을 줄이기 위한 기준입니다.

### SoundlogSurface (Compatibility)

반복 미디어 항목, 모달, 실제 도구 프레임처럼 경계가 필요한 기존 화면에서만 씁니다. 일반 페이지 섹션이나 상태 안내를 `hero`, `glass` 카드로 감싸지 말고 `SectionTitle + SettingsRow`로 표현합니다. 새 카드의 기본 반경은 `rounded-lg`입니다.

```tsx
<SoundlogSurface variant="glass">
  <SoundlogSectionHeader
    title="주변 사운드"
    description="여행 모드 사용자의 공개 음악"
  />
</SoundlogSurface>
```

| Variant    | Role                              |
| ---------- | --------------------------------- |
| `base`     | 기존 반복 카드 호환               |
| `glass`    | 기존 모달·도구 카드 호환          |
| `hero`     | 신규 사용 금지                    |
| `media`    | Recap/이미지 중심 카드            |
| `elevated` | 세그먼트 컨트롤 같은 raised shell |

### SoundlogButton

CTA와 보조 액션에 씁니다. 모든 variant는 최소 44px 이상 터치 영역을 유지합니다.

```tsx
<SoundlogButton iconName="navigation" label="새 여행 시작" onPress={startTravel} />
<SoundlogButton label="나중에" variant="secondary" />
<SoundlogButton label="여행 종료" size="compact" variant="danger" />
```

| Variant     | Use                                    |
| ----------- | -------------------------------------- |
| `primary`   | 라임 CTA, 선택/시작/확정               |
| `secondary` | 같은 레벨의 보조 액션                  |
| `ghost`     | 카드 안의 가벼운 액션                  |
| `danger`    | 여행 종료, 신고처럼 주의가 필요한 액션 |

### SoundlogSectionHeader

섹션 타이틀, 설명, 작은 우측 액션을 한 번에 배치합니다. 긴 제목과 설명은 줄 수를 제한해 작은 화면에서 깨지지 않게 합니다.

```tsx
<SoundlogSectionHeader
  actionIconName="refresh-cw"
  actionLabel="새로고침"
  description="지금 위치와 무드에 맞는 음악을 보여줘요."
  onActionPress={refresh}
  title="오늘의 추천"
/>
```

### SoundlogMetric (Compatibility)

기존 미디어 결과물 안의 짧은 지표만 표현합니다. 일반 페이지의 여행 시간, 리캡 개수, 위치 상태는 `SettingsRow`의 `rightText`를 사용합니다.

```tsx
<SettingsRow icon="camera" label="저장한 리캡" rightText="4개" />
<SettingsRow icon="map-pin" label="현재 장소" rightText="한강공원" />
```

## Class Recipes

반복되는 NativeWind class 조합은 `soundlogRecipes`에서 꺼내 씁니다. recipe는 현재 앱 스타일의 이름표일 뿐이고, 화면마다 필요한 state/접근성 props는 컴포넌트에서 직접 명시합니다.

```tsx
import { AppText, soundlogRecipes } from '@/design-system';

<View className={soundlogRecipes.card.glass}>
  <AppText className={soundlogRecipes.text.sectionTitle}>주변 사운드</AppText>
</View>
```

자주 쓰는 recipe:

| Recipe                   | Role                                  |
| ------------------------ | ------------------------------------- |
| `screen.content`         | `px-5 pt-4` 기본 화면 안쪽 여백       |
| `card.glass`             | 기존 미디어/모달의 흰색 10% 표면      |
| `card.media`             | Recap처럼 이미지/미디어가 중심인 카드 |
| `button.primary`         | 56px 라임 CTA                         |
| `button.icon`            | 44px 원형 아이콘 버튼                 |
| `control.segmentedShell` | 홈 모드 세그먼트 바깥 컨테이너        |
| `travel.activeCard`      | 기존 여행 진행 카드 호환 recipe       |
| `recap.listCard`         | 기존 Recap 카드 호환 recipe           |

프리미티브로 표현 가능한 경우에는 recipe를 직접 붙이기보다 프리미티브를 먼저 씁니다. 예를 들어 버튼은 `soundlogRecipes.button.primary`를 직접 복붙하기보다 `SoundlogButton variant="primary"`를 우선 선택합니다.

## Screen Recipes

### Standard App Screen

```tsx
<Screen>
  <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32 }}>
    <PageHeader title="보관함" />
    <View className="mt-7">
      <SectionTitle title="저장한 음악" />
      <SettingsRow icon="music" label="곡 제목" rightText="아티스트" />
    </View>
  </ScrollView>
</Screen>
```

### Segmented Control

홈의 `HomeHeader` 패턴을 재사용합니다.

- 바깥 트랙: `rounded-full border border-white/10 bg-white/[0.06] p-1`
- 선택 탭: 라임 또는 흰색 배경
- 선택 탭 text: `text-soundlog-inverse`

### Filter Bar

`HomeTopFilterBar`처럼 pill 컨테이너 안에 `Chip`을 가로 스크롤로 배치합니다.

- 컨테이너: `rounded-full border border-soundlog-border/70 bg-soundlog-chip/70 py-2 pl-2`
- 칩 간격: `gap-2`
- 끝 여백: `pr-5`

### Music Card

`FeaturedPlaylistCard`와 `MoodRecommendationCard`가 기준입니다.

- 추천 플레이리스트: `h-[260px] w-[180px] rounded-lg border border-white/10 bg-soundlog-card p-4`
- 무드 카드: `h-[136px] w-[136px] rounded-lg p-4`
- 제목은 1-2줄 제한, 설명은 1-2줄 제한을 기본으로 둡니다.

### Travel Status

새 여행모드 화면은 지도 위 상태와 CTA, 또는 `PageHeader -> SectionTitle -> SettingsRow` 구조로 표현합니다. `TravelStatusCard`와 `travel.activeCard`는 기존 여행 화면 호환용이며 새 일반 화면의 기준으로 사용하지 않습니다.

- active: 지도 위에는 작은 상태 표시와 44px CTA를 사용합니다.
- ended: 여행 요약은 평평한 정보 행과 라임 완료 CTA로 구성합니다.
- idle: 여행 시작은 지도 탭에서만 명확한 단일 CTA로 제공합니다.

### Recap And Share

Recap은 앱에서 가장 감성적인 영역이지만, 기본 표면 규칙은 유지합니다.

- 로그 격자와 지도 핀 목록은 이미지 또는 fallback 콘텐츠가 중심이고 텍스트는 흰색/60 이하 보조 텍스트로 정리합니다.
- 공유 액션은 `ShareActionButton`, `ShareActionList`를 먼저 조립합니다.
- Recap 미리보기는 `RecapPreviewCard`를 기준으로 템플릿만 바꿉니다.
- 스포티파이 그린, 이미지 fallback, Recap 장식색처럼 콘텐츠나 외부 브랜드가 명확한 색은 해당 컴포넌트 안에서만 제한적으로 유지합니다.

## Do

- `bg-soundlog-*`, `text-white/*`, `border-white/*` 토큰을 우선 사용합니다.
- 일반 페이지는 `PageHeader -> SectionTitle -> SettingsRow` 순서로 먼저 조립합니다.
- 선택/확정/시작 액션에는 라임을 씁니다.
- 아이콘 버튼은 `IconButton` 또는 같은 44px 원형 패턴을 유지합니다.
- 긴 제목, 위치명, 곡명은 `numberOfLines`로 줄 수를 제한합니다.
- 리스트 row와 카드에는 `min-w-0`을 사용해 텍스트 overflow를 막습니다.

## Don't

- 일반 배경이나 카드에 새 장식 그라데이션을 만들지 않습니다.
- 단순 정보나 설정 행을 큰 둥근 카드로 감싸지 않습니다.
- 새 폰트나 과한 letter spacing을 추가하지 않습니다.
- 라임을 모든 장식 요소에 뿌리지 않습니다. 라임은 상태와 행동의 언어입니다.
- 카드 안에 또 다른 큰 장식 카드를 중첩하지 않습니다.
- 44px 미만의 터치 버튼을 만들지 않습니다.
- `#FFFFFF` 카드, 베이지 배경, 보라-파랑 랜딩 페이지 톤을 앱 화면에 새로 들여오지 않습니다.

## Design QA Checklist

- 새 화면의 최상위가 `Screen`인지 확인합니다.
- 페이지 제목이 `PageHeader`, 섹션 제목이 `SectionTitle`, 행 정보가 `SettingsRow`를 재사용하는지 확인합니다.
- 새 색상이 필요하면 먼저 `src/constants/colors.ts`, `tailwind.config.js`, `soundlogDesignTokens`에 들어갈 역할 이름을 정합니다.
- 주요 CTA가 하나만 강하게 보이는지 확인합니다.
- iPhone SE 폭에서도 버튼 텍스트와 카드 제목이 넘치지 않는지 확인합니다.
- 탭, 칩, 아이콘 버튼의 접근성 role/label/selected 상태를 확인합니다.
- 로딩, 비어 있음, 실패, 권한 없음 상태가 `EmptyState` 또는 기존 state component로 표현되는지 확인합니다.
- 디자인 리뷰 때는 실제 RN 앱 스크린샷 기준으로 비교합니다. HTML 와이어프레임은 참고 자료이고, 최종 앱 스타일의 기준은 이 RN 디자인 시스템입니다.

# Soundlog 음악 플랫폼 재생 UX MVP 구현 계획

## 1. 작업 목표

현재 앱은 곡 목록과 미니 플레이어 UI를 제공하지만, 실제 음악 플랫폼 연동 상태와 외부 재생 실패 흐름이 충분히 설계되어 있지 않다. 다음 단계에서는 사용자가 선호 음악 플랫폼을 선택하고, 플레이리스트/트랙에서 외부 음악 앱 또는 웹 링크로 안정적으로 이동할 수 있는 MVP 재생 UX를 구축한다.

이번 구현은 실제 Spotify/Melon OAuth나 SDK 스트리밍이 아니라, **외부 플랫폼 선택 + 링크 열기 + 실패/폴백 처리 + 상태 메시지**에 집중한다.

## 2. 사용자 목표

- 사용자는 마이페이지에서 자신이 주로 쓰는 음악 플랫폼을 선택한다.
- 곡 상세 메뉴에서 선택한 플랫폼 기준으로 외부 음악 앱 또는 웹 링크를 열 수 있다.
- 외부 링크가 없거나 열기 실패 시, 사용자는 왜 재생이 안 되는지 이해하고 대체 행동을 선택할 수 있다.
- 앱은 외부 재생 시도 결과를 추천 피드백 이벤트와 분리된 UI 상태로 안전하게 처리한다.

## 3. 범위

### 포함

- 음악 플랫폼 선택 로컬 상태 추가
- 마이페이지에 음악 플랫폼 연결/선택 카드 추가
- 지원 플랫폼: Spotify, Melon, YouTube Music, 기타/미설정
- Track 타입에 플랫폼별 외부 URL 맵 추가
- 목업 트랙에 플랫폼별 URL 보강
- 곡 더보기 메뉴의 `외부 음악 앱에서 열기` UX 개선
- 외부 링크 열기 요청 상태 메시지
- 링크가 없을 때 검색 URL fallback 생성

### 제외

- Spotify OAuth
- Melon OAuth
- 음악 플랫폼 SDK 기반 인앱 재생
- 백그라운드 오디오 재생
- 잠금화면 미디어 컨트롤
- 앱 설치 여부 기반 깊은 딥링크 강제
- 서버 기반 트랙 ID 정규화
- 실제 음원 스트리밍 권한 처리
- 외부 재생 결과를 추천 피드백 이벤트로 기록

## 4. 중요한 제품 결정

이번 MVP에서 음악 플랫폼은 **필수 연동이 아니라 선택 설정**으로 다룬다.

이유:

- 현재 앱은 추천/기록 UX를 먼저 검증하는 단계다.
- OAuth와 SDK 연동은 제공사별 심사, 토큰 저장, 이용 약관 검토가 필요하다.
- 외부 링크 기반 UX만으로도 “Soundlog에서 추천받고 기존 음악 앱에서 듣기” 흐름을 검증할 수 있다.

후속 단계에서 실제 OAuth가 필요하면 Spotify와 Melon 중 우선 연동 대상을 별도 결정해야 한다.

## 5. 기능 계약

### Entry Point

- `마이페이지 > 음악 플랫폼 연동`
- `플레이리스트 상세 > 트랙 더보기 > 외부 음악 앱에서 열기`
- `미니 플레이어 > 현재 곡 액션`은 후속으로 확장

### Exit Point

- 플랫폼 선택 시 로컬 저장 후 마이페이지 상태가 갱신된다.
- 외부 링크 열기 요청 성공 시 메뉴가 닫힌다.
- HTTPS URL은 앱이 설치되어 있지 않아도 브라우저로 열릴 수 있으므로, 브라우저 fallback도 성공으로 본다.
- URL 생성 불가 또는 `Linking.openURL` reject 시에만 실패 메시지를 표시한다.
- 플랫폼별 URL이 없으면 `artist + title` 기반 검색 URL을 생성해 연다.
- 플랫폼 미설정 상태에서는 기본값으로 YouTube Music 검색 URL을 사용한다. 이는 계정 연동 없이도 가장 빠르게 음악 검색 플로우를 검증하기 위한 MVP 결정이다.

## 6. 데이터 모델

### Music Platform

```ts
type MusicPlatformId = 'spotify' | 'melon' | 'youtubeMusic' | 'none';

type MusicPlatformPreference = {
  id: MusicPlatformId;
  updatedAt?: string;
};
```

### Track 확장

```ts
type Track = {
  externalUrl?: string;
  platformUrls?: Partial<Record<Exclude<MusicPlatformId, 'none'>, string>>;
};
```

`externalUrl`은 기존 호환용 기본 링크로 유지한다. `platformUrls`가 있으면 사용자의 선호 플랫폼 URL을 우선 사용하고, 없으면 검색 URL fallback을 사용한다.

## 7. 저장소 설계

신규 파일:

```txt
src/store/musicPlatformStore.ts
```

상태:

- `selectedPlatformId`
- `updatedAt` ISO-8601 string

액션:

- `setSelectedPlatform(id)`
- `resetPlatform()`

Persist:

- Zustand persist + AsyncStorage
- 저장 키: `soundlog-music-platform`
- `createJSONStorage(() => AsyncStorage)` 사용
- `partialize`로 `selectedPlatformId`, `updatedAt`만 저장
- OAuth 토큰 또는 계정 정보는 저장하지 않는다.

## 8. 유틸 설계

신규 파일:

```txt
src/utils/musicPlatformLinks.ts
```

역할:

- 선택 플랫폼에 맞는 track URL 선택
- URL이 없을 때 검색 URL 생성
- 외부 URL 열기
- 플랫폼별 표시명/아이콘/설명 제공
- 곡 제목이 비어 있으면 fallback 검색 URL을 만들지 않고 액션을 비활성화한다.

검색 fallback:

| 플랫폼 | URL |
| --- | --- |
| Spotify | `https://open.spotify.com/search/{query}` |
| Melon | `https://www.melon.com/search/total/index.htm?q={query}` |
| YouTube Music | `https://music.youtube.com/search?q={query}` |
| none | 기존 `track.externalUrl` 또는 YouTube Music 검색 |

딥링크 정책:

- MVP에서는 커스텀 스킴을 직접 사용하지 않는다.
- iOS `canOpenURL`용 `LSApplicationQueriesSchemes` 설정이 필요해지는 앱 설치 감지는 후속으로 둔다.
- 안정성을 위해 HTTPS universal/web URL을 우선 사용한다.

## 9. UI 설계

### 마이페이지 음악 플랫폼 카드

기존 메뉴 아이템의 “음악 플랫폼 연동”을 실제 카드로 승격한다.

표시:

- 현재 선택 플랫폼
- 설명: `추천 음악은 선택한 플랫폼의 외부 링크로 열어요.`
- 플랫폼 선택 칩: Spotify / Melon / YouTube Music / 미설정
- 칩에는 `accessibilityRole="radio"`와 `accessibilityState={{ selected }}`를 제공한다.

배치:

- 권한 설정 카드 아래, 기본 메뉴 위
- 권한 카드와 같은 설정 톤을 사용하되, 음악 앱이라는 핵심 기능이 보이도록 `music` 아이콘 사용

### TrackActionMenu 개선

현재:

- `외부 음악 앱에서 열기` 단일 액션
- 실패/진행 상태 없음

변경:

- 액션 label을 선택 플랫폼에 맞게 변경
  - 예: `Spotify에서 열기`, `Melon에서 열기`, `YouTube Music에서 열기`
- 링크 없는 경우에도 fallback 검색으로 열기
- 열기 중 중복 탭 방지
- URL 생성 불가 또는 `Linking.openURL` reject 시 오류 메시지 표시
  - `이 곡을 열 수 있는 링크를 만들지 못했어요.`
  - `음악 링크를 열지 못했어요. 다시 시도해주세요.`
- 열기 중에는 모달 닫기와 액션 중복 탭을 막는다.

기존 사용처 확인:

- `TrackActionMenu`만 `track.externalUrl`로 외부 링크를 열고 있다.
- `MiniPlayer`는 현재 외부 링크 액션을 제공하지 않는다.
- `PlaylistCurationScreen`은 `TrackActionMenu`에 선택 트랙을 전달한다.
- 따라서 `externalUrl`은 기존 호환 필드로 유지하고, `platformUrls` 선택 로직은 `TrackActionMenu` 내부 유틸로만 연결한다.

## 10. 이벤트/추천 로그

이번 단계에서는 외부 재생 열기 결과를 `recommendationEventStore`에 기록하지 않는다.

이유:

- 외부 링크 열기 성공/실패는 추천 품질 신호가 아니라 UX/연동 품질 신호다.
- 추천 이벤트 로그와 섞으면 후속 모델 학습 데이터 의미가 흐려진다.
- 서버 전송 전까지 로컬에서만 보관한다.

후속으로 필요하면 별도 `playbackUxEventStore` 또는 서버 제품 분석 이벤트로 분리한다.

후속 분석에 포함할 후보:

- 선택 플랫폼
- fallback 검색 사용 여부
- URL 생성 실패 여부

## 11. 예외 상태

| 상황 | 처리 |
| --- | --- |
| 플랫폼 미설정 | 기본 링크 또는 YouTube Music 검색으로 열기 |
| track externalUrl 없음 | 선택 플랫폼 검색 URL 생성 |
| 제목이 없음 | 외부 열기 액션 비활성 |
| Linking.openURL reject | 메뉴 내 오류 메시지 표시 |
| HTTPS가 브라우저로 열림 | 성공으로 처리 |
| 사용자가 빠르게 중복 탭 | `isOpeningExternal`로 중복 방지 |
| Web 환경 | 새 탭/현재 탭 링크 이동. 팝업 차단 또는 reject 시 안내 |
| 아티스트 없음 | title 단독으로 fallback 검색 |
| 플랫폼 선택 변경 | 즉시 persist, 다음 트랙 액션부터 반영 |

## 12. 구현 파일 계획

신규 파일:

```txt
src/store/musicPlatformStore.ts
src/utils/musicPlatformLinks.ts
src/components/my/MusicPlatformSettingsCard.tsx
```

수정 파일:

```txt
src/types/domain.ts
src/mocks/playlistMocks.ts
src/components/playlist/TrackActionMenu.tsx
app/(tabs)/my.tsx
```

## 13. 구현 순서

1. `MusicPlatformId`, `platformUrls` 타입 추가
2. 음악 플랫폼 preference store 추가
3. 플랫폼 링크 선택/검색 URL 생성 유틸 추가
4. 목업 트랙에 플랫폼 URL 일부 보강
5. 마이페이지 음악 플랫폼 설정 카드 추가
6. TrackActionMenu 외부 재생 액션 개선
7. 타입체크 및 Expo export 검증

## 14. 검증 계획

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform android --output-dir .expo-export-smoke-android
npx expo export --platform ios --output-dir .expo-export-smoke
npx expo export --platform web --output-dir .expo-export-smoke-web
```

수동 확인:

- 마이페이지에서 플랫폼 선택이 저장되는지 확인
- 플랫폼 선택 후 트랙 메뉴 label이 바뀌는지 확인
- 플랫폼 URL이 있는 곡은 해당 URL로 열리는지 확인
- URL이 없는 곡은 검색 URL fallback이 생성되는지 확인
- title이 없는 곡은 외부 열기 액션이 비활성화되는지 확인
- URL 생성 실패 또는 `Linking.openURL` reject 시 메뉴에 오류 메시지가 표시되는지 확인
- iOS 시뮬레이터와 Android 에뮬레이터에서 HTTPS 링크가 브라우저 fallback으로 열리는지 확인

## 15. 후속 작업

- Spotify OAuth 및 계정 연결
- Melon 연동 가능 범위 조사
- 플랫폼별 트랙 ID 정규화
- 인앱 preview 재생 또는 expo-av 기반 미리듣기 검토
- 커스텀 스킴 기반 앱 설치 감지 및 직접 앱 열기
- 별도 playback UX 분석 이벤트 스토어 또는 서버 이벤트 설계

## 16. Claude 리뷰 기록

Claude 리뷰 완료.

Blocking 이슈:

- HTTPS URL은 대부분 브라우저 fallback으로 열리므로, 앱 미설치를 실패로 볼 수 없음
- fallback 검색과 곡 정보 없음 비활성 정책이 충돌함
- 기존 `externalUrl` 사용처 확인이 필요함
- Zustand persist 세부 설정이 부족함

반영:

- `Linking.openURL` 실패는 URL 생성 불가 또는 Promise reject로만 정의
- 브라우저 fallback은 성공 처리로 변경
- title 없음은 액션 비활성으로 통일
- `externalUrl` 사용처 확인 결과를 계획에 명시
- AsyncStorage, `createJSONStorage`, `partialize` persist 정책 추가
- 외부 재생 UX 이벤트는 추천 이벤트 로그에 기록하지 않도록 범위 수정
- 플랫폼 선택 칩 접근성, 시뮬레이터/에뮬레이터 수동 검증 추가

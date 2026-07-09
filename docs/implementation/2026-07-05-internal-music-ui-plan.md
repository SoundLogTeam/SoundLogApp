# Internal music UI policy

> Superseded: 2026-07 현재 제품 방향은 `docs/product/SOUNDLOG_TRAVEL_SOUNDTRACK_LOG_SPEC.md`
> 및 `docs/product/SOUNDLOG_APP_PLANNING.md`의 "외부 음악 링크 + 기록/Recap" 정책을 따른다.
> 아래 내용은 인앱 재생/Spotify 제어 제거 과정에서 검토한 과거안이며, 현재 자동 검증은
> Spotify OAuth/재생 제어와 가짜 playback 이벤트만 금지하고 외부 검색 링크는 허용한다.

## Context

Music actions must not imply in-app streaming or remote playback control. The current MVP may send users to external search/deep links such as Spotify, YouTube Music, YouTube, or Melon while keeping the Soundlog core value in selection, recording, and Recap.

## UI contract

- Tapping a recommended track selects it as the current SoundLog music context.
- The mini player shows the selected track as a SoundLog context panel and may offer explicit external-link actions.
- The full music panel offers SoundLog-native actions: previous/next recommendation, like, save, and moment capture with the selected track.
- Track action menus may include external music app/search actions, but must not expose play/pause/skip controls unless a real playback integration is implemented.
- Web export and deployed-web checks must fail if Spotify OAuth, playback helpers, fake playback events, or mock API handlers are bundled.

## Verification

- `npm run typecheck`
- `npm run check:server-web-export`
- `npm run check:deployed-web -- https://soundlog.shop` after deployment

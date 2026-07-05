# Internal music UI policy

## Context

Music actions must stay inside SoundLog. The app does not stream audio and should not send users to YouTube Music, Melon, Spotify, or generated search URLs from the main recommendation, playlist, library, or mini-player flows.

## UI contract

- Tapping a recommended track selects it as the current SoundLog music context.
- The mini player shows the selected track as a SoundLog context panel, not as playback or an external link panel.
- The full music panel offers SoundLog-native actions: previous/next recommendation, like, save, and moment capture with the selected track.
- Track action menus should not include external music app actions.
- Server-provided `externalUrl` and `platformUrls` must be stripped from frontend runtime track state.
- Web export and deployed-web checks must fail if YouTube Music URLs or external platform open helpers are bundled.

## Verification

- `npm run typecheck`
- `npm run check:server-web-export`
- `npm run check:deployed-web -- https://soundlog.shop` after deployment

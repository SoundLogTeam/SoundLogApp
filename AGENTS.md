# Soundlog Agent Rules

- Do not merge GitHub pull requests unless the user's latest message explicitly asks to merge that exact PR.
- PR creation, CI verification, reviewer assignment, issue closing, or "finish the task" does not imply merge approval.
- If a merge request is ambiguous, ask for confirmation before using any merge UI, GitHub API, or commands such as `gh pr merge`.

## Platform Direction

- Soundlog is a mobile app product. We do not intend to ship or maintain a public web deployment as a product surface.
- Treat Expo web as a development or CI/export compatibility target only. Do not design product behavior around web deployment unless the user explicitly asks for web support.
- When a feature depends on native capabilities such as camera, location, media library, sharing, secure storage, or app permissions, prioritize iOS/Android behavior and native Expo APIs.
- Do not block mobile feature work just because the same flow cannot fully work on web. Provide a minimal web fallback only when it is needed for local development, type checking, preview safety, or export stability.

## Mandatory Simulator Testing

- Never use Expo web, a deployed web app, or a browser to test or validate Soundlog product behavior, UI, server integration, permissions, or regressions.
- Run every product test and visual verification in the iOS Simulator. A browser result must never be treated as evidence that the app works correctly.
- After a Soundlog app change, launch the app in the iOS Simulator and verify the affected flow there before reporting completion.
- API health checks and command-line diagnostics may support investigation, but they do not replace simulator verification and must not be reported as completed app testing.
- Use a web target only for explicit web build or export compatibility work. Even then, do not use it for product acceptance testing unless the user's latest message explicitly overrides this rule.

## Text Color

- 기본 사용자 노출 텍스트와 버튼, 탭, 칩의 인터랙션 라벨은 흰색 또는 흰색 투명도 계열을 사용한다. 상태를 구분하는 의미 색상과 브랜드 강조 색상은 예외로 둔다.
- `text-black`, 검정색, 진한 보라색 텍스트 값을 새로 추가하지 않는다.
- 기본, 보조, 비활성 텍스트의 명도 차이는 검정색이나 회색 고정값이 아니라 `#FFFFFF` 또는 `rgba(255,255,255,alpha)`로 표현한다.
- 밝은 강조 배경에서 검정색 텍스트로 대비를 해결하지 않는다. 흰색 텍스트가 읽히도록 배경과 테두리 대비를 조정한다.
- `colors.text.inverse`와 `text-soundlog-inverse`는 흰색 의미를 유지한다.
- 사용자에게 보이는 문자열은 React Native의 `Text`를 직접 사용하지 않고 기본 글자색이 흰색인 `AppText`를 사용한다.
- `text-white/52`처럼 기본 Tailwind에 없는 투명도를 사용하면 `tailwind.config.js`의 opacity에도 같은 값을 선언해 검정색 기본값으로 떨어지지 않게 한다.
- UI 변경 후 `text-black`, `color: 'black'`, `#000000`, `#4A1D96`가 텍스트 색상으로 추가되지 않았는지 검색한다. 그림자, 배경, 아이콘, 지도 스타일은 이 검사 대상이 아니다.

## Recap And Log Domain

- Before changing Recap, Log, camera capture, travel mode, route tracking, map pins, visibility, or related API behavior, read `docs/product/RECAP_LOG_DOMAIN_MODEL.md`.
- Treat that document as the canonical product contract when older planning docs or legacy code names conflict with it.
- Product `Recap` means one capture saved from the camera flow.
- Product `Log` means one or more Recaps created in the same travel-mode session. A standalone Recap created outside travel mode is not a one-item Log.
- A travel Log is identified by `sessionId`, even when it contains only one Recap. Never merge Logs by date, place, distance, or track.
- A Log detail map may show only its member Recap pins and its own session route. Do not mix nearby/public pins or other Logs into that map.
- `MomentLog` and the server `Recap` model are legacy technical names. Follow the product-to-code mapping in the canonical domain document instead of exposing those terms to users.

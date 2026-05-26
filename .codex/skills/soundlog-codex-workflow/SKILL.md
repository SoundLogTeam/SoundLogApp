---
name: soundlog-codex-workflow
description: Soundlog React Native/Expo 앱에서 기능을 설계하거나 구현하거나 문서를 정리할 때 사용하는 프로젝트 전용 워크플로우. Use when working on Soundlog screens, mock APIs, recap, music curation, location, permissions, Codex collaboration, or non-developer guided development.
---

# Soundlog Codex Workflow

## Start Here

Before changing code, load only the docs relevant to the task:

- Product context: `docs/product/SOUNDLOG_APP_PLANNING.md`
- RN frontend principles: `docs/frontend/RN_FRONTEND_PLANNING_POINTS.md`
- Home screen: `docs/frontend/MAIN_PAGE_RN_BUILD_DOC.md`
- Music curation: `docs/frontend/MUSIC_CURATION_PAGE_RN_BUILD_DOC.md`
- Recap share: `docs/frontend/RECAP_SHARE_PAGE_RN_BUILD_DOC.md`
- Mock API: `src/mock-server/README.md`
- Non-developer workflow: `docs/codex/NON_DEVELOPER_CODEX_GUIDE.md`
- UI feedback loop: `docs/codex/UI_FEEDBACK_LOOP.md`

## Working Loop

1. Inspect the current code and docs before planning.
2. Define the feature contract: user goal, affected screens, state, API/mock needs, permissions, loading/empty/error/offline states.
3. Ask the user only about product-risk edge cases, especially privacy, location tracking, music-platform policy, persistence, or sharing behavior.
4. Create a concrete implementation plan with files to modify and verification steps.
5. Review the plan before editing. If Claude review is available, use it; otherwise perform a Codex self-review and revise the plan.
6. Implement with scoped changes.
7. Verify with `npm run typecheck`; for UI work also check web or simulator when practical.
8. Review the diff, fix issues, then summarize. Commit only when the user asks.

For natural-language UI feedback, use the narrower `soundlog-ui-feedback-loop` workflow. It forces the loop:

`plan -> plan review -> revise plan -> implement -> code/UI review -> revise implementation`

## Project Patterns

- Use React Native/Expo with TypeScript, Expo Router, React Query, Zustand, NativeWind, and EAS-ready native modules.
- Keep server-like behavior behind `src/api` facades and `src/mock-server` handlers so screens can work before backend APIs exist.
- Use `EXPO_PUBLIC_MOCK_API_DELAY_MS` and `EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS` to test loading and failure states.
- Keep travel mode and mood filters separate. Travel modes describe activity or context; mood filters describe emotional sound direction.
- Avoid top-level imports of native-only modules when web can load the file. Lazy import native modules or guard with `Platform.OS`.
- Prefer query-backed data for server/mock state and local stores only for user selections or lightweight persisted UI state.
- Recap UI should preserve visual share quality: stable capture frame, clear CTA states, graceful fallback when sharing or media permissions fail.

## Verification Checklist

- `npm run typecheck`
- `npm run check` when changing setup or dependencies
- Web check for UI changes: `npm run web`
- Failure-state check when touching API facades or mock server
- `git diff --check` before commit

## Commit Style

When asked to commit, use concise Korean messages with a conventional prefix, for example:

- `feat: 리캡 공유 화면 개선`
- `fix: 웹 네이티브 모듈 로딩 오류 수정`
- `docs: Codex 개발 가이드 추가`

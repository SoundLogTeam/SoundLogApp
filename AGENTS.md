# Soundlog Agent Rules

- Do not merge GitHub pull requests unless the user's latest message explicitly asks to merge that exact PR.
- PR creation, CI verification, reviewer assignment, issue closing, or "finish the task" does not imply merge approval.
- If a merge request is ambiguous, ask for confirmation before using any merge UI, GitHub API, or commands such as `gh pr merge`.

## Platform Direction

- Soundlog is a mobile app product. We do not intend to ship or maintain a public web deployment as a product surface.
- Treat Expo web as a development or CI/export compatibility target only. Do not design product behavior around web deployment unless the user explicitly asks for web support.
- When a feature depends on native capabilities such as camera, location, media library, sharing, secure storage, or app permissions, prioritize iOS/Android behavior and native Expo APIs.
- Do not block mobile feature work just because the same flow cannot fully work on web. Provide a minimal web fallback only when it is needed for local development, type checking, preview safety, or export stability.

---
name: soundlog-ui-feedback-loop
description: Soundlog 앱에서 비개발자의 자연어 UI 수정 요청을 받아 계획, 계획 리뷰, 반영, 구현, 코드리뷰, 리뷰 반영 루프로 처리하는 스킬. Use when the user asks to change UI, polish screens, adjust layout, make a page prettier, align with Figma/screenshots, or iterate on frontend visual feedback in the Soundlog React Native/Expo app.
---

# Soundlog UI Feedback Loop

## Goal

Turn vague natural-language UI feedback into a safe implementation loop:

`request -> clarify intent -> plan -> plan review -> revise plan -> implement -> code/UI review -> revise implementation -> verify -> summarize`

## Required Loop

1. **Interpret the request.** Translate the user's natural language into concrete UI goals: screen, component, target user, expected visual/interaction result.
2. **Load context.** Read only relevant docs and code:
   - `docs/frontend/RN_FRONTEND_PLANNING_POINTS.md`
   - page-specific docs under `docs/frontend/`
   - current component files under `app/`, `src/components/`, `src/features/`, `src/shared/`
3. **Ask only product-risk questions.** Ask the user when intent affects core UX, data meaning, privacy, navigation, or a visible product concept. Infer small spacing/copy/style choices from existing patterns.
4. **Create a UI implementation plan.** Include affected files, component boundaries, state changes, responsive concerns, loading/empty/error states, and verification steps.
5. **Plan review.** Review the plan before editing. Prefer Claude review when available; otherwise do a Codex self-review using the checklist in `docs/codex/UI_FEEDBACK_LOOP.md`.
6. **Revise the plan.** Apply real review findings before code edits.
7. **Implement.** Keep edits scoped. Preserve existing design language and avoid unrelated refactors.
8. **Code/UI review.** Review the diff with `soundlog-ui-reviewer` criteria: correctness, layout stability, accessibility, platform behavior, state coverage, and consistency.
9. **Revise implementation.** Fix review findings before final verification.
10. **Verify.** Run `npm run typecheck`; for UI changes, check web/simulator when practical and run `git diff --check`.

## UI Rules

- Keep travel-mode filters and mood filters separate.
- Use existing colors, spacing, components, and data contracts before inventing new patterns.
- Text must not overflow, overlap, or rely on viewport-scaled font sizes.
- Cards are for repeated items or contained tools; avoid unnecessary card-in-card layouts.
- Native-only APIs must not be imported at top level in web-loaded files.
- Any mock data needed for UI states should live in `src/mock-server` or a clearly scoped fixture.

## Final Response

Report:

- what changed
- review findings fixed
- verification commands run
- any remaining risk or unverified visual state

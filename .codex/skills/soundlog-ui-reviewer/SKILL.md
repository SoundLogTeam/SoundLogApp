---
name: soundlog-ui-reviewer
description: Soundlog React Native/Expo UI 변경사항을 코드리뷰하고, 비개발자 피드백이 실제 화면 품질로 반영됐는지 검토하는 스킬. Use when reviewing Soundlog UI diffs, checking design polish, validating Figma alignment, or performing the code review step after frontend implementation.
---

# Soundlog UI Reviewer

## Review Priorities

Lead with actionable findings. Focus on issues that can break the user experience.

1. **Correctness:** Does the UI match the requested behavior and Soundlog product concept?
2. **State coverage:** Loading, empty, error, offline/mock failure, permission denial, and no-data states.
3. **Layout stability:** No overlap, clipping, unexpected scrolling, unsafe-area issues, or text overflow on common mobile widths.
4. **Platform safety:** Web must not crash from native module imports. iOS/Android permission and sharing flows need graceful fallback.
5. **Component boundaries:** UI-only changes should not leak business logic into presentation components.
6. **Design consistency:** Use existing typography, color tokens, spacing, cards, buttons, and icon patterns.
7. **Accessibility:** Clear labels, readable contrast, touch targets near 44px, meaningful disabled/loading states.
8. **Data contracts:** Mock/API shape changes must stay compatible with query hooks and types.

## Review Format

When reviewing, use this order:

1. Findings by severity with file/line references when possible.
2. Open questions only if they block correctness.
3. Quick summary of what looks good.
4. Verification gaps.

If there are no issues, say so clearly and still mention residual risk.

## Required Checks

- `npm run typecheck`
- `git diff --check`
- `npm run check` when setup, dependencies, or native config changes
- Web/simulator visual check when the change is visual and a target screen is obvious

## Soundlog-Specific Gotchas

- Home top filters are recommendation scopes; mood chips are emotional sound directions.
- Recap sharing must handle unsupported web share/download and failed capture.
- Moment logging must not silently assume photo, location, or music exists unless the product decision is documented.
- Mock API failures should be testable through `EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS`.

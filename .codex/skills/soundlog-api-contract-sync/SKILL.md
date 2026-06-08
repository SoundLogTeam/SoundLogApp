---
name: soundlog-api-contract-sync
description: Soundlog에서 front-first로 만든 기능의 API 계약을 추출하고, SoundLogTeam/api-docs OpenAPI 문서와 SoundLogServer DTO/validator/service에 반영하는 워크플로우. Use when the user asks to update API docs from frontend/mock work, sync backend DTOs, reflect frontend-first changes into server, or keep SoundLogTeam/api-docs current.
---

# Soundlog API Contract Sync

## Goal

Keep three surfaces aligned:

1. `SoundLogApp`: `src/api`, `src/mock-server`, `src/types/domain`, screens/hooks
2. `SoundLogTeam/api-docs`: `openapi/soundlog-api.yaml`
3. `SoundLogServer`: routes, validators, DTO/service responses, seed/mock data

Use this when a feature was built front-first and backend/API contracts must catch up.

## Required Workflow

1. **Update local main branches**
   - In `SoundLogApp`, pull latest `main`.
   - In sibling repos `../api-docs` and `../SoundLogServer`, pull latest `main` when present.
   - Never push directly to SoundLogApp `main`; create a `codex/` branch for app changes.

2. **Extract frontend contract**
   - Inspect changed or relevant files:
     - `src/api/*Api.ts`, `src/api/*Queries.ts`
     - `src/mock-server/types.ts`, `src/mock-server/*Handlers.ts`
     - `src/types/domain.ts`
     - affected screens under `app/` and `src/components/`
     - local stores that create payloads, especially recommendation/library/moment/session stores
   - Classify each contract as `new`, `changed`, `removed`, or `frontend-only`.

3. **Write API contract**
   - Update `../api-docs/openapi/soundlog-api.yaml`.
   - Use `templates/endpoint-contract.md` when drafting a new endpoint.
   - Keep request/response names stable and backend-friendly.
   - Include empty/error states when frontend depends on them.

4. **Reflect backend DTO**
   - Update `../SoundLogServer/src/validators/api.validators.ts` for request/query/body shape.
   - Update service DTO response mapping in `src/services/soundlog.service.ts` and `src/services/mock-soundlog.service.ts`.
   - Update seed/mock data only when frontend requires concrete demo behavior.
   - Avoid Prisma migrations unless the contract truly needs persistence.

5. **Review**
   - Use `references/frontend-contract-extraction.md` and `references/backend-dto-handoff.md`.
   - Check that backend can implement from docs without reading frontend code.
   - Check that frontend can consume server responses without additional mapping surprises.

6. **Verify**
   - App docs/skill-only changes: `git diff --check`
   - API docs: YAML structure smoke check and `git diff --check`
   - Server: `pnpm run typecheck` or `npm run typecheck` depending on repo scripts, plus tests if DTO behavior changed

## Output Expectations

Report separately:

- App skill or contract extraction changes
- API docs changes
- Server DTO/validator/service changes
- Verification commands
- Any unresolved backend implementation risk

## Guardrails

- Do not invent backend fields only for UI decoration; mark them frontend-only or derive them in a mapper.
- Keep `TravelMode` and `MusicRecommendationMode` distinct.
  - `TravelMode`: walk, drive, cafe, ocean, festival, night
  - `MusicRecommendationMode`: everyday, travel
- If an app mock response has extra fields, either document them or explicitly call them frontend-only.
- If `api-docs` and server disagree, treat `api-docs` as the handoff contract and update server to match.

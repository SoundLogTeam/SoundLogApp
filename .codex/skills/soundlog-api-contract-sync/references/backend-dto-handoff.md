# Backend DTO Handoff

Use this checklist before saying backend DTO reflection is complete.

## DTO Review

- Request DTO has all frontend params/body fields.
- Response DTO contains all fields consumed by screens.
- Optional fields are genuinely optional in frontend rendering.
- Enums match frontend string values exactly.
- Server validation accepts comma-separated query arrays when frontend/API docs use CSV.
- Server response envelope matches OpenAPI: `{ data }` for single/list unless paginated.
- Paginated lists return `{ data, page }`.

## Server Files

- `src/routes/index.ts`: endpoint exists and method/path matches OpenAPI.
- `src/validators/api.validators.ts`: query/body/params match OpenAPI.
- `src/services/soundlog.service.ts`: real DB DTO mapping matches response schema.
- `src/services/mock-soundlog.service.ts`: mock DB mode matches the same schema.
- `src/data/seed-data.ts`: demo data exists when UI needs meaningful local verification.
- `prisma/schema.prisma`: update only when persistence truly requires a new column/table.

## Review Prompt

Ask: "Can a backend developer implement this from `api-docs` without opening the frontend repo?"

If no, add descriptions, examples, enum notes, or nullable behavior to `openapi/soundlog-api.yaml`.

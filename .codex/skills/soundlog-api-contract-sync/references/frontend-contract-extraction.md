# Frontend Contract Extraction

Use this checklist when extracting API needs from SoundLogApp.

## Read Order

1. Screen entry under `app/`
2. Query hooks under `src/api/*Queries.ts`
3. API facade under `src/api/*Api.ts`
4. Mock handler and mock params under `src/mock-server`
5. Domain types under `src/types/domain.ts`
6. Event/local stores that create server payloads

## Contract Questions

- Which screen or user flow needs this data?
- Is the data currently query-backed, mock-backed, or local-store only?
- Is the field persisted by backend or derived by frontend?
- What happens when the response is empty?
- What happens when nullable fields are missing?
- Are enum values Korean labels or stable English identifiers?
- Does the frontend send a full object in mock mode that must become IDs/query params in HTTP mode?

## Common Soundlog Decisions

- `MusicRecommendationMode` is a recommendation scope toggle: `everyday | travel`.
- `TravelMode` is a trip/activity context: `walk | drive | cafe | ocean | festival | night`.
- `MoodRecommendation.playlistId` is optional. If absent, app can play the embedded `track`.
- TourAPI raw fields should not leak to app DTOs; normalize to `PlaceContext`.

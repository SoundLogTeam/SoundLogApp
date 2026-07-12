# Soundlog Product Spec v0.2

## 1. Product Direction

Soundlog is a location-based music travel log app.

The product is not centered on in-app streaming. Soundlog helps users:

1. discover music that fits the current place,
2. leave a sound log at that place,
3. turn moments into a recap,
4. discover public recaps left nearby by other users.

Core sentence:

> Soundlog lets users leave a sound log at a place and discover public sound recaps around them.

## 2. Core Concepts

### Moment

A Moment is the smallest record unit.

Required or optional data:

- photo: optional for MVP, but recommended for richer recap quality
- location: optional fallback allowed, but public map exposure requires location
- place: optional place name or Tour API place id
- recordedAt: required
- track: optional
- caption: optional
- visibility: `private` or `public`

### Log

A Log is a trip-level group of Moments.

- When travel mode is active, newly created Moments are attached to the active Log.
- When travel mode is inactive, a created Moment becomes a single-moment Log.
- A Log itself is primarily private. Public discovery happens through public Recaps derived from Moments or Logs.

### Recap

A Recap is the rendered, shareable result of one Moment or one Log.

Supported MVP templates:

- album
- film
- lp
- map

Visibility:

- `private`: visible only to owner
- `public`: shown as a map marker to nearby users

### Public Recap Marker

A Public Recap Marker is a map pin created from a public Recap.

- It remains on the map unless the owner deletes it or moderation hides it.
- It is only returned to other users when they are within the configured discovery radius.
- MVP discovery radius: 300 meters.

## 3. Tab Information Architecture

### 3.1 Travel Mode

Route: `/travel`

Role:

- Map-first page.
- Starts and manages travel mode.
- Shows nearby public recaps and my recaps on the map.

Primary user jobs:

- Start a travel log.
- See what public sound recaps exist near me.
- See my own recaps on the map.
- Open a nearby recap marker.

Main UI:

- native map
- current location marker
- marker filter chips
- travel start CTA
- active travel status
- selected marker preview card

Filter chips:

- `장소 보기`: default map mode. Shows travel mode CTA.
- `전체 리캡`: shows nearby public recaps from all users. Hides travel mode CTA.
- `내 리캡`: shows my public and private recaps. Hides travel mode CTA.

Marker policy:

- `전체 리캡` returns only public recaps within 300m of the user location.
- `내 리캡` can include private recaps.
- Markers outside the radius are not rendered in MVP.

### 3.2 Everyday Mode

Route: `/`

Role:

- Music recommendation page.
- Does not require an active travel session.

Primary user jobs:

- Get today's soundtrack based on current location.
- Adjust mood and recommendation scope.
- Select a track to use in future Moments/Recaps.

Recommendation inputs:

- current location
- nearby Tour API place
- place category and keywords
- selected mood
- optional user taste profile
- time of day

### 3.3 Recap

Route: `/recap`

Role:

- Public log exploration, all-log browsing, and owner's log management page.
- Opens the Camera tool from a floating CTA.

Primary user jobs:

- View public Logs from other users.
- View all visible Logs in a grid.
- Open a Log detail.
- Manage public/private visibility for my saved Logs.

Top sections:

- `다른사람 보기`
- `모든 사람 보기`

Creation entry:

- Bottom navigation has a center camera CTA for Moment creation.
- Camera is not a content tab. Camera is opened from contextual record flows such as the center camera CTA and Travel Mode.

### 3.4 My Page

Route: `/my`

Role:

- Account, taste, permissions, and privacy settings.

## 4. Camera Policy

Camera is a tool, not a main tab.

Entry points:

- Bottom navigation: center camera CTA
- Travel Mode: `기록 남기기`

Behavior:

- If travel mode is active, captured Moment is attached to the active Log.
- If travel mode is inactive, captured Moment becomes a single-moment Log.
- Music can be selected from current soundtrack, recommendation list, or a search flow.
- MVP fallback: allow "music none".

## 5. API Contract Summary

### Public Recap Discovery

`GET /v1/recap-markers`

Query:

- `lat`: number
- `lng`: number
- `radiusMeters`: number, default 300
- `scope`: `public` or `mine`

Returns:

- marker id
- recap id
- coordinate
- place name
- title
- owner alias
- track title
- artist name
- template id
- visibility
- distance meters

### Recap Visibility

`PATCH /v1/recaps/:id/visibility`

Body:

- `visibility`: `private` or `public`

Returns:

- updated recap summary

### Create Recap

`POST /v1/recaps`

Existing endpoint remains, with additional fields:

- `visibility`
- `title`
- `templateId`
- `momentLogIds`
- `sessionId`

## 6. MVP Priority

P0:

- 4-tab structure: Travel Mode, Everyday Mode, Recap, My Page
- Camera tab removed from bottom navigation
- Travel map filters: place, all public recaps, my recaps
- Public recap marker API facade on frontend
- Recap visibility field in frontend/server contract
- Swagger/OpenAPI docs updated

P1:

- Music search during recap creation
- Public recap report/hide
- Nearby recap entry notification
- Merge single-moment Logs into a trip Log

P2:

- Companion shared Log
- Travel mate matching
- Live current-listening map

import { getApiBaseUrl } from '@/api/client';

export type AuthenticatedImageSource = {
  headers?: Record<string, string>;
  uri: string;
};

// Uploaded files are always served at a path that starts with `/uploads/<fileId>` or
// `/v1/uploads/<fileId>` (see SoundLogServer's upload.middleware.ts /
// upload-file.service.ts — the legacy `/uploads/` form is still resolved server-side for
// old rows). Anchoring at the start of the pathname (`^`) is required: a loose
// `pathname.includes('/uploads/')` check would also match an unrelated external URL such
// as `https://cdn.example.com/gallery/uploads/photo.jpg` (the substring appears in the
// middle of the path). Matching the pathname shape is necessary but NOT sufficient on its
// own — see the origin check below.
const UPLOADED_FILE_PATHNAME_PATTERN = /^\/(v1\/)?uploads\/[^/]+\/?$/;

// A fixed, inert placeholder used only so `new URL(uri, base)` always has *some* base to
// resolve a relative `uri` against and therefore always yields a `.pathname`/`.origin` we
// can test — it is never fetched or otherwise used.
const INERT_URL_RESOLUTION_BASE = 'http://soundlog-local.invalid';

// Whether `uri` carries its own explicit scheme/host (`https://host/...`, `//host/...`) as
// opposed to being relative (`/uploads/x`, `uploads/x`). Deliberately checked on the RAW
// string rather than by comparing a parsed `.origin` against the inert placeholder above:
// comparing against the placeholder would let a malicious `uri` that literally spells out
// our placeholder host (e.g. `http://soundlog-local.invalid/uploads/x`) get misclassified
// as "relative" and therefore trusted.
const EXPLICIT_SCHEME_OR_HOST_PATTERN = /^([a-zA-Z][a-zA-Z\d+\-.]*:)?\/\//;

function safeOrigin(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

// The set of absolute origins allowed to receive the Authorization header. A relative `uri`
// (no explicit scheme/host) is trusted implicitly — it can only resolve against whatever
// origin the app itself was loaded from (e.g. the web build's same-origin `/api/soundlog`
// rewrite), so there is nothing to allowlist. An absolute `uri` must match one of these:
//
//  - the origin the app's own JSON API calls go to (`getApiBaseUrl()`), when that base URL
//    is itself absolute (on native/production it usually is; on web it is often a relative
//    path, in which case this contributes nothing and relative-uri trust covers it), and
//  - `EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN`, an explicit allowlist entry for the host that
//    actually serves uploaded files. This is necessary because the uploads host can
//    legitimately differ from the JSON API's host/proxy (e.g. API calls go through
//    `https://soundlog.shop/api/soundlog`, a Vercel proxy, while uploaded photos are served
//    directly from `https://api.soundlog.shop` — see SoundLogServer's
//    `UPLOAD_PUBLIC_BASE_URL`). When this env var is not set, only the API base origin is
//    trusted (a safe, conservative fallback — never "trust everything").
function getAllowedUploadOrigins(): ReadonlySet<string> {
  const origins = new Set<string>();

  const apiBaseUrl = getApiBaseUrl();
  const apiOrigin = apiBaseUrl ? safeOrigin(apiBaseUrl) : undefined;

  if (apiOrigin) {
    origins.add(apiOrigin);
  }

  const uploadOrigin = process.env.EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN;
  const resolvedUploadOrigin = uploadOrigin ? safeOrigin(uploadOrigin) : undefined;

  if (resolvedUploadOrigin) {
    origins.add(resolvedUploadOrigin);
  }

  return origins;
}

function isUploadedFileUri(uri: string, allowedOrigins: ReadonlySet<string>): boolean {
  let parsed: URL;

  try {
    parsed = new URL(uri, INERT_URL_RESOLUTION_BASE);
  } catch {
    return false;
  }

  if (!UPLOADED_FILE_PATHNAME_PATTERN.test(parsed.pathname)) {
    return false;
  }

  if (!EXPLICIT_SCHEME_OR_HOST_PATTERN.test(uri)) {
    // No explicit scheme/host in the original string: relative to our own app, trusted.
    return true;
  }

  // Absolute uri: only ever trust it if its real origin is one we explicitly allow. This is
  // the actual defense against a hostile host that happens to reuse the same pathname shape
  // (e.g. `https://evil.example.com/uploads/anything`) — pathname matching alone cannot
  // distinguish that from a legitimate uploads URL.
  return allowedOrigins.has(parsed.origin);
}

/**
 * Uploaded photos (moment photos, recap background/disc art) are served from our own API
 * behind `GET /v1/uploads/:fileId`, which requires an `Authorization` header — plain
 * `<Image source={{ uri }}>` never sends one, so the request would 401.
 *
 * This resolves a photo URL into an `expo-image`/RN `Image` source, attaching `accessToken`
 * as a header only when `uri` both (a) has the uploads pathname shape and (b) is either
 * relative (implicitly same-origin as the app) or absolute with an origin on the allowlist
 * (see `getAllowedUploadOrigins`). Any other URL — external album art, tourism API photos,
 * local `file://` capture previews, or a hostile URL merely shaped like an uploads path on
 * an untrusted host — is returned unchanged, with no header attached. This origin check is
 * what actually prevents the access token from being sent to a third-party server; pathname
 * matching by itself only rejects unrelated paths on hosts we already trust.
 *
 * `accessToken` must be passed in explicitly by the caller (read at render time, typically
 * via the `useAuthenticatedImageSource` hook in `@/hooks/useAuthenticatedImageSource`, which
 * subscribes to the auth store so images pick up a refreshed token or logout immediately).
 * This function itself does no reactive reads, so it is also safe to call directly inside
 * `.map()`/`renderItem` loops where hooks cannot be used, as long as the caller has already
 * subscribed to the token higher up the tree.
 */
export function toAuthenticatedImageSource(
  uri: string | undefined,
  accessToken: string | undefined,
): AuthenticatedImageSource | undefined {
  if (!uri) {
    return undefined;
  }

  if (!accessToken || !isUploadedFileUri(uri, getAllowedUploadOrigins())) {
    return { uri };
  }

  return {
    headers: { Authorization: `Bearer ${accessToken}` },
    uri,
  };
}

# soundlog.shop deployment

Soundlog 운영/테스트 도메인은 아래 구조로 사용합니다.

| Host | Target | Purpose |
| --- | --- | --- |
| `soundlog.shop` | Vercel | Expo web frontend |
| `www.soundlog.shop` | Vercel | Frontend alias |
| `api.soundlog.shop` | GCP Compute Engine | Express API (Caddy로 HTTPS 직접 종료) |
| `soundlog.shop/api/soundlog` | Vercel rewrite | 웹 빌드 전용 API 프록시 (브라우저 CORS 회피) |

## Gabia DNS

Gabia DNS 관리툴에서 아래 레코드를 설정합니다.

| Type | Host | Value |
| --- | --- | --- |
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com.` |
| `A` | `api` | `34.64.116.40` |

API 컨테이너는 GCP VM(`soundlog-api`, `asia-northeast3-a`)의 Docker Compose 스택에서 동작하고, VM 위의 Caddy가 `api.soundlog.shop`에 대한 Let's Encrypt 인증서를 자동으로 발급해 HTTPS를 직접 종료합니다. `api` A 레코드가 GCP 정적 IP를 가리키기 전까지는 인증서 발급이 되지 않으므로 `https://api.soundlog.shop`은 동작하지 않습니다.

## Vercel

Vercel project domain에 아래 도메인을 추가합니다.

- `soundlog.shop`
- `www.soundlog.shop`

Web build는 `vercel.mjs`에서 `EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog`를 주입합니다. `/api/soundlog/:path*` 요청은 Vercel이 서버 사이드에서 `SOUNDLOG_API_ORIGIN`으로 rewrite합니다. 이 프록시는 브라우저 fetch가 same-origin이 되도록 웹 빌드에서만 사용하며, 모바일 앱은 `api.soundlog.shop`을 직접 호출합니다.

Vercel 환경변수에 아래 값을 설정합니다.

```dotenv
SOUNDLOG_API_ORIGIN=https://api.soundlog.shop
```

브라우저가 호출하는 공개 API URL은 계속 `https://soundlog.shop/api/soundlog`입니다. `SOUNDLOG_API_ORIGIN`은 Vercel 서버 사이드 rewrite에서만 쓰이는 내부 origin입니다.

## EAS app env

`development`, `preview`, `production` profile은 `api.soundlog.shop`을 직접 호출합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server
EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=https://api.soundlog.shop
```

Production profile은 추가로 약관/개인정보 URL과 지원 메일을 설정합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_PRIVACY_URL=https://soundlog.shop/legal/privacy
EXPO_PUBLIC_SOUNDLOG_TERMS_URL=https://soundlog.shop/legal/terms
EXPO_PUBLIC_SOUNDLOG_SUPPORT_EMAIL=support@soundlog.shop
```

## Verification

DNS와 HTTPS 설정이 끝나면 아래 명령으로 확인합니다.

```bash
dig +short soundlog.shop A
dig +short www.soundlog.shop CNAME
dig +short api.soundlog.shop A
curl -I https://soundlog.shop
curl https://api.soundlog.shop/v1/health
curl https://soundlog.shop/api/soundlog/v1/health
npm run check:deployed-web -- https://soundlog.shop
```

`check:deployed-web`는 로그인 필수 API도 검증합니다. 반복 실행 시 DB에 smoke
계정이 계속 생기는 것을 피하려면 `SOUNDLOG_CHECK_EMAIL`,
`SOUNDLOG_CHECK_PASSWORD`를 지정해 고정 검증 계정으로 실행합니다. 값을 지정하지
않으면 스크립트가 `@soundlog.test` 임시 계정을 생성합니다.

GCP origin을 직접 검증하려면 아래 명령을 실행합니다. 이 검사는 `/openapi.yaml`, fallback 장소 source, Spotify 메타데이터 제거 여부까지 확인하므로 예전 백엔드로 잘못 붙은 경우 실패합니다.

```bash
SOUNDLOG_API_ORIGIN=https://api.soundlog.shop npm run check:api-origin
```

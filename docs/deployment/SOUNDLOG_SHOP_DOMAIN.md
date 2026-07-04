# soundlog.shop deployment

Soundlog 운영/테스트 도메인은 아래 구조로 사용합니다.

| Host | Target | Purpose |
| --- | --- | --- |
| `soundlog.shop` | Vercel | Expo web frontend |
| `www.soundlog.shop` | Vercel | Frontend alias |
| `soundlog.shop/api/soundlog` | Vercel rewrite | Express API proxy |

## Gabia DNS

Gabia DNS 관리툴에서 아래 레코드를 설정합니다.

| Type | Host | Value |
| --- | --- | --- |
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com.` |

별도 `api` 서브도메인은 사용하지 않습니다. API 컨테이너는 EC2 `4000` 포트에서 동작하고, Vercel이 `https://soundlog.shop/api/soundlog/:path*` 요청을 EC2 API로 rewrite합니다.

## Vercel

Vercel project domain에 아래 도메인을 추가합니다.

- `soundlog.shop`
- `www.soundlog.shop`

Web build는 `vercel.json`에서 `EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog`를 주입합니다. `/api/soundlog/:path*` 요청은 Vercel이 서버 사이드에서 EC2 API `http://52.79.185.121:4000/:path*`로 rewrite합니다.

## EAS app env

`development`, `preview`, `production` profile은 `soundlog.shop` HTTPS Vercel proxy를 사용합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server
EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=https://soundlog.shop/api/soundlog
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
curl -I https://soundlog.shop
curl https://soundlog.shop/api/soundlog/v1/health
```

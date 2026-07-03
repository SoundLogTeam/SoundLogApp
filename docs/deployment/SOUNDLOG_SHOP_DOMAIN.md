# soundlog.shop deployment

Soundlog 운영/테스트 도메인은 아래 구조로 사용합니다.

| Host | Target | Purpose |
| --- | --- | --- |
| `soundlog.shop` | Vercel | Expo web frontend |
| `www.soundlog.shop` | Vercel | Frontend alias |
| `api.soundlog.shop` | EC2 reverse proxy | Express API |

## Gabia DNS

Gabia DNS 관리툴에서 아래 레코드를 설정합니다.

| Type | Host | Value |
| --- | --- | --- |
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com.` |
| `A` | `api` | EC2 Elastic IP |

DNS에는 port를 넣을 수 없습니다. API 컨테이너는 EC2 내부 `4000` 포트로 두고, `api.soundlog.shop`의 HTTPS 요청은 EC2 reverse proxy가 `127.0.0.1:4000`으로 전달합니다.

## Vercel

Vercel project domain에 아래 도메인을 추가합니다.

- `soundlog.shop`
- `www.soundlog.shop`

Web build는 `vercel.json`에서 `EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=/api/soundlog`를 주입하고, `/api/soundlog/:path*` 요청을 `https://api.soundlog.shop/:path*`로 rewrite합니다.

## EC2 HTTPS reverse proxy

EC2 보안 그룹은 외부에서 `80`, `443`, SSH 포트만 열고, API `4000` 포트는 직접 공개하지 않는 구성을 권장합니다.

Caddy를 사용할 경우 예시 설정은 아래와 같습니다.

```caddyfile
api.soundlog.shop {
  reverse_proxy 127.0.0.1:4000
}
```

## EAS app env

`development`, `preview`, `production` profile은 모두 아래 값을 사용합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server
EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=https://api.soundlog.shop
```

Production profile은 추가로 약관/개인정보 URL과 지원 메일을 `soundlog.shop` 기준으로 설정합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_PRIVACY_URL=https://soundlog.shop/privacy
EXPO_PUBLIC_SOUNDLOG_TERMS_URL=https://soundlog.shop/terms
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
```

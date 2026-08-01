# Soundlog app deployment domain

Soundlog는 웹 서비스를 운영하거나 배포하지 않습니다. 출시 대상은 Expo/EAS로 빌드한 iOS·Android 네이티브 앱이며, 앱은 GCP API를 직접 호출합니다. Vercel은 운영 배포 경로에 포함하지 않습니다.

## Production architecture

| Host | Target | Purpose |
| --- | --- | --- |
| `api.soundlog.shop` | GCP Compute Engine | 앱 API, 업로드, 개인정보 처리방침, 이용약관, 고객지원 |

앱의 모든 네트워크 요청은 `https://api.soundlog.shop`으로 전송됩니다. GCP VM의 Caddy가 HTTPS를 종료하고 Express API로 reverse proxy합니다.

## GCP Cloud DNS

GCP project `nomi-app-deploy-2026`의 `soundlog-shop` public zone을 사용합니다. 도메인 등록기관에서 `soundlog.shop`의 네임서버를 아래 값으로 위임합니다.

- `ns-cloud-d1.googledomains.com`
- `ns-cloud-d2.googledomains.com`
- `ns-cloud-d3.googledomains.com`
- `ns-cloud-d4.googledomains.com`

Cloud DNS에는 아래 운영 레코드가 등록되어 있습니다.

| Type | Host | TTL | Value |
| --- | --- | --- | --- |
| `A` | `api` | `300` | `34.64.116.40` |

기존 AWS Route 53 또는 Vercel 네임서버는 사용하지 않습니다. 등록기관의 네임서버 위임이 Cloud DNS로 바뀐 뒤 Caddy가 `api.soundlog.shop`의 인증서를 자동 발급합니다.

## EAS app env

`development`, `preview`, `production` profile은 모두 GCP API를 직접 호출합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server
EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=https://api.soundlog.shop
EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN=https://api.soundlog.shop
```

Production profile은 App Store와 앱 설정에 사용할 공개 법적 문서 URL을 같은 GCP 서버로 지정합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_PRIVACY_URL=https://api.soundlog.shop/legal/privacy
EXPO_PUBLIC_SOUNDLOG_TERMS_URL=https://api.soundlog.shop/legal/terms
EXPO_PUBLIC_SOUNDLOG_SUPPORT_EMAIL=support@soundlog.shop
```

## Public pages

- 개인정보 처리방침: `https://api.soundlog.shop/legal/privacy`
- 서비스 이용약관: `https://api.soundlog.shop/legal/terms`
- 고객지원: `https://api.soundlog.shop/support`

세 페이지는 로그인 없이 접근할 수 있어야 하며 SoundLogServer가 직접 HTML로 제공합니다.

## Verification

```bash
dig +short soundlog.shop NS
dig +short api.soundlog.shop A
curl https://api.soundlog.shop/v1/health
curl -I https://api.soundlog.shop/legal/privacy
curl -I https://api.soundlog.shop/legal/terms
curl -I https://api.soundlog.shop/support
SOUNDLOG_API_ORIGIN=https://api.soundlog.shop npm run check:api-origin
```

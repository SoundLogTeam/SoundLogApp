# Soundlog 앱 배포 도메인

Soundlog는 웹 서비스를 운영하지 않습니다. 출시 대상은 Expo와 EAS로 빌드한 iOS 및 Android 네이티브 앱입니다. Vercel은 운영 앱의 네트워크 경로에 포함하지 않습니다.

## 운영 주소

| 주소 | 용도 | 현재 상태 |
| --- | --- | --- |
| `https://api.soundlog.p-e.kr` | 앱 API, 파일 업로드, ML 음악 추천 | 운영 앱이 직접 호출 |
| `https://api.soundlog.p-e.kr/legal/privacy` | 개인정보 처리방침 | 최신 서버 배포 후 사용하는 공개 문서 |
| `https://api.soundlog.p-e.kr/legal/terms` | 서비스 이용약관 | 최신 서버 배포 후 사용하는 공개 문서 |
| production EAS 지원 메일 | 고객지원 | 실제 수신과 답장이 확인된 주소를 설정 |

새 API 도메인의 `/v1/health`와 `/openapi.yaml`은 정상 응답합니다. `/v1/recommendations/playlists`는 인증된 요청에 ML 추천을 반환합니다. 새 API 도메인의 `/legal/privacy`, `/legal/terms`, `/support`는 최신 서버 배포 후 사용합니다. 심사 전에는 세 경로의 200 응답과 고객지원 메일 수신을 확인해야 합니다.

## EAS 앱 환경변수

`development`, `preview`, `production` profile은 모두 새 API와 ML 서버를 직접 호출합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_API_SOURCE=server
EXPO_PUBLIC_SOUNDLOG_API_BASE_URL=https://api.soundlog.p-e.kr
EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN=https://api.soundlog.p-e.kr
```

Production profile은 공개 법적 문서와 고객지원 정보를 기존 주소로 유지합니다.

```dotenv
EXPO_PUBLIC_SOUNDLOG_PRIVACY_URL=https://api.soundlog.p-e.kr/legal/privacy
EXPO_PUBLIC_SOUNDLOG_TERMS_URL=https://api.soundlog.p-e.kr/legal/terms
EXPO_PUBLIC_SOUNDLOG_SUPPORT_EMAIL=실제_수신_가능한_메일
```

## 검증

```bash
curl https://api.soundlog.p-e.kr/v1/health
curl -I https://api.soundlog.p-e.kr/openapi.yaml
SOUNDLOG_API_ORIGIN=https://api.soundlog.p-e.kr npm run check:api-origin
curl -I https://api.soundlog.p-e.kr/legal/privacy
curl -I https://api.soundlog.p-e.kr/legal/terms
```

`check:api-origin`은 임시 계정을 생성해 인증 API와 ML 음악 추천을 확인한 뒤 계정을 즉시 삭제합니다.

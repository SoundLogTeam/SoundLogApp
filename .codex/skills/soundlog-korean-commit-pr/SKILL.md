---
name: soundlog-korean-commit-pr
description: Soundlog 저장소에서 커밋, 푸시, PR 생성, PR 제목/본문 정리를 한국어로 일관되게 수행하는 워크플로우. Use when the user asks to commit, push, create or update a PR, check PR titles, standardize commit/PR wording, or prepare Korean pull requests for SoundLogApp, api-docs, or SoundLogServer.
---

# Soundlog Korean Commit PR

## Goal

Soundlog 관련 저장소의 변경사항을 안전하게 커밋하고, 한국어로 읽히는 PR을 만든다.

대상 저장소:

- `SoundLogApp`
- `SoundLogTeam/api-docs`
- `SoundLogServer`

## Required Workflow

1. **상태 확인**
   - `git status --short --branch`로 현재 브랜치와 변경 파일을 확인한다.
   - `git diff --stat`과 필요한 diff를 읽고, 요청 범위 밖의 변경은 stage하지 않는다.
   - `main` 또는 보호 브랜치에 있으면 `codex/` 브랜치를 만든다.

2. **검증**
   - 코드 변경이면 가능한 가장 가까운 검증 명령을 실행한다.
   - 문서/스킬 변경이면 최소 `git diff --check`를 실행한다.
   - 실행하지 못한 검증은 PR 본문과 최종 응답에 이유를 적는다.

3. **커밋**
   - 커밋 메시지는 반드시 한국어 요약으로 작성한다.
   - 형식: `<type>: <한국어 요약>`
   - 허용 prefix:
     - `feat:` 기능 추가 또는 사용자 경험 변화
     - `fix:` 버그 수정
     - `docs:` 문서, 스킬, API 명세 변경
     - `refactor:` 동작 유지 리팩터링
     - `test:` 테스트 추가/수정
     - `chore:` 설정, 정리, 유지보수
     - `build:` 빌드/패키지 변경
     - `ci:` CI/CD 변경
   - 예시:
     - `docs: 한국어 커밋 PR 스킬 추가`
     - `feat: 추천 모드 DTO 계약 반영`
     - `fix: 웹 권한 모듈 로딩 오류 수정`

4. **푸시**
   - 현재 작업 브랜치만 push한다.
   - `SoundLogApp`의 `main`에는 절대 직접 push하지 않는다.

5. **PR 생성 또는 갱신**
   - 기존 PR이 있으면 새 PR을 만들지 말고 해당 PR을 갱신한다.
   - PR 제목은 반드시 한국어 conventional 스타일로 쓴다.
   - 단일 커밋 PR이면 PR 제목은 커밋 제목과 맞추는 것을 기본값으로 한다.
   - 여러 변경이 섞이면 가장 큰 목적을 제목에 둔다.

6. **PR 제목 검수**
   - PR 생성/수정 후 `gh pr view ... --json title,body,url`로 실제 제목을 다시 확인한다.
   - 제목이 영어만 있거나 범위가 틀리거나 변경 내용을 충분히 대표하지 못하면 `gh pr edit --title`로 수정한다.

## PR Body Template

PR 본문은 한국어로 작성하고, 저장소 템플릿이 없으면 아래 구조를 사용한다.

```markdown
## 작업 내용
- 변경한 핵심 내용을 2~4개로 요약

## 검증
- 실행한 명령 또는 확인한 항목

## 참고
- 리뷰어가 알아야 할 제약, 미실행 검증, 연관 PR
```

## Multi-Repo PR Rules

`SoundLogApp`, `api-docs`, `SoundLogServer`를 함께 수정할 때는 각 PR 본문에 연관 PR을 남긴다.

- 앱 PR: API 문서/서버 PR이 함께 필요한지 적는다.
- API 문서 PR: 기준이 된 프론트 변경 또는 서버 반영 PR을 적는다.
- 서버 PR: 어떤 API 문서 계약을 반영했는지 적는다.

## Quality Bar

- 제목만 보고도 변경 목적이 보여야 한다.
- PR 본문은 파일 목록이 아니라 리뷰 관점의 요약이어야 한다.
- 검증 결과는 실제 실행한 명령 그대로 적는다.
- 실패하거나 생략한 검증은 숨기지 않는다.
- 관련 없는 변경이 섞였으면 커밋 전에 분리한다.

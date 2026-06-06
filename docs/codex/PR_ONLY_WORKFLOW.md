# PR 전용 개발 흐름

Soundlog는 `main` 브랜치에 직접 push하지 않고, 모든 변경을 PR로 합치는 방식으로 관리합니다.

## 팀원이 처음 해야 할 일

```bash
npm install
```

또는 이미 설치가 끝난 상태라면 아래 명령어로 Git hook을 활성화합니다.

```bash
npm run setup:githooks
```

이 설정은 로컬 Git의 `core.hooksPath`를 `.githooks`로 지정하고, `main` 브랜치로 직접 push하는 행동을 차단합니다.

## 개발 시작

```bash
git switch main
git pull --ff-only
git switch -c codex/my-change
```

작업 후에는 feature 브랜치만 push합니다.

```bash
git push -u origin codex/my-change
```

그 다음 GitHub에서 `main`으로 Pull Request를 생성합니다.

## 금지되는 흐름

```bash
git push origin main
git push origin HEAD:main
```

위 명령은 로컬 pre-push hook에서 차단됩니다. GitHub 저장소에서도 branch protection rule로 한 번 더 차단해야 합니다.

## GitHub 저장소 보호 규칙

GitHub에서 `main` 브랜치에 아래 규칙을 적용합니다.

- Require a pull request before merging
- Require approvals
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Do not allow bypassing the above settings
- Include administrators

## PR 검증

PR이 열리면 `.github/workflows/pr-check.yml`이 실행되어 TypeScript 타입 검사를 수행합니다.

로컬에서도 PR을 만들기 전에 아래 명령을 실행합니다.

```bash
npm run typecheck
```

#!/bin/sh
set -eu

repo_root=$(git rev-parse --show-toplevel 2>/dev/null || true)

if [ -z "$repo_root" ]; then
  echo "Git repository not found. Skipping git hook setup."
  exit 0
fi

cd "$repo_root"

if [ ! -f ".githooks/pre-push" ]; then
  echo ".githooks/pre-push not found. Skipping git hook setup."
  exit 0
fi

chmod +x .githooks/pre-push
git config core.hooksPath .githooks

echo "Git hooks enabled: core.hooksPath=.githooks"

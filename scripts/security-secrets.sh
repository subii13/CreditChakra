#!/usr/bin/env bash
# Fails the build if gitleaks finds secrets in the working tree, staged
# files, or repository history.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks is not installed."
  echo "Install: https://github.com/gitleaks/gitleaks#installing"
  echo "  (e.g. 'brew install gitleaks' or download a release binary)"
  exit 1
fi

echo "Running gitleaks against working tree + history..."
gitleaks detect --source . --config .gitleaks.toml --redact --no-banner

echo "Running gitleaks against staged files..."
gitleaks protect --source . --config .gitleaks.toml --staged --redact --no-banner

echo "No secrets detected."

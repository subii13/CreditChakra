#!/usr/bin/env bash
# Fails the build on high/critical dependency vulnerabilities.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Running npm audit (backend)..."
(cd backend && npm audit --audit-level=high)

echo "Running npm audit (frontend)..."
(cd frontend && npm audit --audit-level=high)

if command -v osv-scanner >/dev/null 2>&1; then
  echo "Running osv-scanner..."
  osv-scanner --recursive .
else
  echo "osv-scanner not installed; skipping (install from https://github.com/google/osv-scanner for a second opinion)."
fi

echo "Dependency scan passed."

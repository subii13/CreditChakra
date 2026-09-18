#!/usr/bin/env node
// Installs a git pre-commit hook that blocks commits containing secrets.
// Runs automatically via the root "prepare" npm script.
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const gitDir = path.join(repoRoot, ".git");

if (!fs.existsSync(gitDir)) {
  console.log("Not a git repository (or .git missing); skipping hook install.");
  process.exit(0);
}

const hooksDir = path.join(gitDir, "hooks");
fs.mkdirSync(hooksDir, { recursive: true });

const hookPath = path.join(hooksDir, "pre-commit");
const hookContents = `#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if command -v gitleaks >/dev/null 2>&1; then
  echo "Running gitleaks on staged changes..."
  gitleaks protect --source . --config .gitleaks.toml --staged --redact --no-banner
else
  echo "WARNING: gitleaks not installed locally; commit is NOT secret-scanned." >&2
  echo "Install gitleaks (https://github.com/gitleaks/gitleaks) before pushing." >&2
fi
`;

fs.writeFileSync(hookPath, hookContents, { mode: 0o755 });
fs.chmodSync(hookPath, 0o755);
console.log("Installed pre-commit secret-scanning hook at .git/hooks/pre-commit");

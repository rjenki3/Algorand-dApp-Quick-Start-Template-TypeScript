#!/usr/bin/env bash
set -euo pipefail

echo "==> Ensure pipx on PATH"
export PATH="$HOME/.local/bin:$PATH"

echo "==> Install pipx (user)"
python3 -m pip install --user pipx
python3 -m pipx ensurepath || true

echo "==> Install/upgrade AlgoKit via pipx"
# If already present, upgrade; otherwise install
if command -v algokit >/dev/null 2>&1; then
  pipx upgrade algokit || true
else
  pipx install algokit
fi

echo "==> Python libs used by the project (user scope)"
python3 -m pip install --user -U py-algorand-sdk python-dotenv algokit-utils || true

FRONTEND_DIR="QuickStartTemplate/projects/QuickStartTemplate-frontend"
CONTRACTS_DIR="QuickStartTemplate/projects/QuickStartTemplate-contracts"

echo "==> Install frontend deps"
( npm --prefix "$FRONTEND_DIR" ci || npm --prefix "$FRONTEND_DIR" install )

echo "==> Ensure client generator is present (dev dep)"
npm --prefix "$FRONTEND_DIR" install --save-dev @algorandfoundation/algokit-client-generator@latest || true

echo "==> (Optional) install contracts deps if present"
if [ -f "$CONTRACTS_DIR/package.json" ]; then
  ( npm --prefix "$CONTRACTS_DIR" ci || npm --prefix "$CONTRACTS_DIR" install )
fi

echo "==> Link/bootstrap (non-interactive; safe to no-op)"
(
  cd "$FRONTEND_DIR"
  ALGOKIT_NO_INTERACTIVE=1 ALGOKIT_NO_SPINNER=1 algokit project link --all || true
)
ALGOKIT_NO_INTERACTIVE=1 ALGOKIT_NO_SPINNER=1 algokit project bootstrap all || true

echo "==> Build frontend"
npm --prefix "$FRONTEND_DIR" run build

echo "✅ Build complete"

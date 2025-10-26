#!/usr/bin/env bash
set -euo pipefail

echo "==> Ensure pipx on PATH"
export PATH="$HOME/.local/bin:$PATH"

echo "==> Install pipx (user)"
python3 -m pip install --user pipx
python3 -m pipx ensurepath || true

echo "==> Install/upgrade AlgoKit via pipx"
if command -v algokit >/dev/null 2>&1; then
  pipx upgrade algokit || true
else
  pipx install algokit
fi

echo "==> Python libs used by the project (user scope)"
python3 -m pip install --user -U py-algorand-sdk python-dotenv algokit-utils || true

# -----------------------------------
# Resolve frontend directory
# -----------------------------------
# If we're already inside the frontend folder, use '.'
# Otherwise fallback to the monorepo path
if [ -f "./package.json" ] && grep -q '"name": "QuickStartTemplate-frontend"' ./package.json 2>/dev/null; then
  FRONTEND_DIR="."
else
  FRONTEND_DIR="QuickStartTemplate/projects/QuickStartTemplate-frontend"
fi

echo "==> FRONTEND_DIR resolved to: $FRONTEND_DIR"

echo "==> Install frontend deps"
( npm --prefix "$FRONTEND_DIR" ci || npm --prefix "$FRONTEND_DIR" install )

echo "==> Ensure client generator is present (dev dep)"
npm --prefix "$FRONTEND_DIR" install --save-dev @algorandfoundation/algokit-client-generator@latest || true

echo "==> Link/bootstrap (non-interactive; safe to no-op)"
(
  cd "$FRONTEND_DIR"
  ALGOKIT_NO_INTERACTIVE=1 ALGOKIT_NO_SPINNER=1 algokit project link --all || true
)
ALGOKIT_NO_INTERACTIVE=1 ALGOKIT_NO_SPINNER=1 algokit project bootstrap all || true

echo "==> VITE_API_URL (from Vercel env): ${VITE_API_URL:-<empty>}"
if [ -n "${VITE_API_URL:-}" ]; then
  printf "VITE_API_URL=%s\n" "$VITE_API_URL" > "$FRONTEND_DIR/.env.production"
  echo "==> Wrote $FRONTEND_DIR/.env.production"
fi

echo "==> Build frontend"
npm --prefix "$FRONTEND_DIR" run build

echo "✅ Build complete"

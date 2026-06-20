#!/usr/bin/env bash
# Container entrypoint: bring the Snipdash UI up automatically on
# `docker compose up`. The mode is controlled by APP_MODE, which is read from
# the .env file by docker-compose (see .env.example):
#
#   development (default) -> Vite dev server with hot reload on :1420
#   production            -> production build served by `vite preview` on :1420
#   manual                -> start nothing; keep the container alive for a shell
#
# In every mode you can still open a shell with: docker compose exec dev bash
set -euo pipefail

cd /workspace

APP_MODE="${APP_MODE:-development}"
echo "[snipdash] APP_MODE=${APP_MODE}"

# node_modules live on named volumes that are empty on first run; install on demand.
if [ ! -d node_modules/.pnpm ]; then
  echo "[snipdash] installing dependencies (first run)…"
  pnpm install
fi

case "${APP_MODE}" in
  production | prod)
    echo "[snipdash] building frontend…"
    pnpm --filter @snipdash/desktop build:vite
    echo "[snipdash] serving production preview on http://0.0.0.0:1420"
    exec pnpm --filter @snipdash/desktop exec vite preview --host --port 1420 --strictPort
    ;;
  manual | none | shell)
    echo "[snipdash] manual mode — not starting the app. Use: docker compose exec dev bash"
    exec sleep infinity
    ;;
  development | dev | *)
    echo "[snipdash] starting Vite dev server on http://0.0.0.0:1420"
    exec pnpm --filter @snipdash/desktop dev:vite
    ;;
esac

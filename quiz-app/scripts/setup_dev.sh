#!/usr/bin/env zsh
# Setup and run the quiz-app development environment on macOS (zsh)
# What this script does:
#  - attempts to start Colima if available, otherwise tries to start Docker Desktop
#  - brings up Postgres + Adminer via docker-compose
#  - waits for Postgres to be ready on localhost:5432
#  - installs npm dependencies
#  - runs DB migration script (npm run db:init)
#  - starts Next.js dev server in background and writes PID to /tmp/quiz-next.pid
#
# Usage: from the `quiz-app` folder run:
#   ./scripts/setup_dev.sh

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

echo "[setup] Running setup in: $ROOT_DIR"

# helper: print and run
run(){
  echo "> $*"
  eval "$@"
}

# Ensure .env.local exists (copy example if not present)
if [ ! -f .env.local ]; then
  if [ -f .env.local.example ]; then
    echo "[setup] Creating .env.local from .env.local.example"
    cp .env.local.example .env.local
  else
    echo "[setup] No .env.local found. Creating a default .env.local (development only)."
    cat > .env.local <<EOF
POSTGRES_USER=quiz_user
POSTGRES_PASSWORD=Str0ngP@ssw0rd!2025
POSTGRES_DB=quizdb
DATABASE_URL=postgres://quiz_user:Str0ngP@ssw0rd!2025@localhost:5432/quizdb

# Optional Supabase (leave empty if not used)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_KEY=
SUPABASE_URL=
SUPABASE_KEY=
EOF
    echo "[setup] Created .env.local -- DO NOT commit this file to git."
  fi
fi

# Start container runtime: prefer colima if available
if command -v colima >/dev/null 2>&1; then
  echo "[setup] Colima found. Ensuring it's running..."
  if colima status >/dev/null 2>&1; then
    echo "[setup] Colima already running."
  else
    echo "[setup] Starting Colima (this may take a few seconds)..."
    run colima start
  fi
else
  echo "[setup] Colima not found. Will attempt to start Docker Desktop if available."
  if command -v docker >/dev/null 2>&1; then
    # quick check docker daemon
    if docker info >/dev/null 2>&1; then
      echo "[setup] Docker daemon already running."
    else
      echo "[setup] Trying to open Docker Desktop (macOS)..."
      open -a Docker || true
      echo "[setup] Waiting up to 60s for Docker to become available..."
      i=0
      while ! docker info >/dev/null 2>&1; do
        sleep 2
        i=$((i+2))
        if [ $i -ge 60 ]; then
          echo "[setup] Timeout waiting for Docker. Please start Docker Desktop and re-run this script." >&2
          exit 1
        fi
      done
    fi
  else
    echo "[setup] Neither colima nor Docker CLI found. Please install Docker Desktop or Colima and try again." >&2
    exit 1
  fi
fi

# Bring up Postgres + Adminer
echo "[setup] Starting Postgres and Adminer with docker-compose..."
run docker-compose up -d

# Wait for Postgres port to be open on localhost:5432
echo "[setup] Waiting for Postgres (localhost:5432) to accept connections..."
WAIT_SECS=0
MAX_WAIT=60
until nc -z localhost 5432 >/dev/null 2>&1 || [ $WAIT_SECS -ge $MAX_WAIT ]; do
  sleep 1
  WAIT_SECS=$((WAIT_SECS+1))
  printf '.'
done
echo
if [ $WAIT_SECS -ge $MAX_WAIT ]; then
  echo "[setup] Postgres did not become ready within ${MAX_WAIT}s. Check docker containers (docker ps) and logs." >&2
  exit 1
fi
echo "[setup] Postgres seems ready."

# Install npm dependencies
echo "[setup] Installing npm dependencies (this may take a while)..."
run npm install

# Apply DB migrations
echo "[setup] Running DB migrations (npm run db:init)"
run npm run db:init

# Start dev server in background (nohup) and save PID
echo "[setup] Starting Next.js dev server in background"
nohup npm run dev > /tmp/quiz-next.log 2>&1 &
echo $! > /tmp/quiz-next.pid
echo "[setup] Next.js dev started (PID=$(cat /tmp/quiz-next.pid)). Logs: /tmp/quiz-next.log"

echo "[setup] Done. Open http://localhost:3000"
echo "[setup] Adminer (DB GUI) available at http://localhost:8080 (user from .env.local)"

exit 0

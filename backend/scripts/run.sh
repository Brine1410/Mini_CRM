#!/usr/bin/env bash
#
# Starts the servlet backend on CRM_PORT (default 8080).
# Run from anywhere; paths resolve from the repository root.
#
set -euo pipefail
cd "$(dirname "$0")/../.."   # repository root

BIN="${JAVA_HOME:+$JAVA_HOME/bin/}java"

if [ ! -d backend/out/classes ] || [ -z "$(ls -A backend/out/classes 2>/dev/null)" ]; then
  echo "[run] classes not found — building first..."
  bash backend/scripts/build.sh
fi

exec "$BIN" -cp "backend/out/classes:backend/lib/*" com.minicrm.Main "$@"

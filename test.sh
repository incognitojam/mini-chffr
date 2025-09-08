#!/bin/bash
set -e

bun install --frozen-lockfile
bun biome ci

bun run index.ts &
SERVER_PID=$!

trap "kill $SERVER_PID 2>/dev/null || true" EXIT

timeout=30
while [ $timeout -gt 0 ]; do
  if curl -s http://localhost:3000/v1.1/devices/test >/dev/null 2>&1; then
    break
  fi
  sleep 1
  timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
  exit 1
fi

bun test

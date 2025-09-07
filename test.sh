#!/bin/bash
set -e

bun install --frozen-lockfile
bun biome ci

bun run index.ts &
SERVER_PID=$!

timeout=30
while [ $timeout -gt 0 ]; do
  if curl -f http://localhost:3000/v1.1/devices/test >/dev/null 2>&1; then
    break
  fi
  sleep 1
  timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

bun test

kill $SERVER_PID 2>/dev/null || true
#!/usr/bin/env bash
# Runs the pure Paddle checkout configuration and recovery-message contract.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node tests/checkout-config.test.mjs
result=$?
exit "$result"

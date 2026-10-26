#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."
node tests/social-preview.test.mjs

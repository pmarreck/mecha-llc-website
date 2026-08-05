#!/usr/bin/env bash
# Starts server.lua, curls all three pages, asserts expected content markers.
set -euo pipefail

PORT="${PORT:-9987}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="$PORT" ./server.lua >/tmp/mecha-smoke.log 2>&1 &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null || true" EXIT

# Wait up to 2s for the server to bind
for _ in $(seq 1 20); do
    if curl -sf "http://127.0.0.1:$PORT/" -o /dev/null; then break; fi
    sleep 0.1
done

check_page() {
    local path="$1"
    local needle="$2"
    local body
    body="$(curl -sf "http://127.0.0.1:$PORT$path")" || {
        echo "FAIL: $path returned non-200"
        exit 1
    }
    if ! grep -qF "$needle" <<<"$body"; then
        echo "FAIL: $path missing expected marker: $needle"
        exit 1
    fi
    echo "OK: $path"
}

check_page "/"            'High-stakes engineering'
check_page "/consulting/" 'AI and engineering help'
check_page "/software/"   'Tools for people who care'
check_page "/contact/"        'Get in touch'
check_page "/legal/terms/"    'Terms of Service'
check_page "/legal/privacy/"  'Privacy Policy'
check_page "/legal/refund/"   'Refund'
check_page "/work/"            'Selected work'
check_page "/work/incitez/"    'incitez'
check_page "/thoughts/"        'Thoughts'
check_page "/thoughts/mfic/"   'Sarbanes-Oxley'

headers="$(curl -sfD - -o /dev/null "http://127.0.0.1:$PORT/assets/js/checkout.mjs")" || {
    echo 'FAIL: checkout module returned non-200'
    exit 1
}
if ! grep -qi '^Content-Type: application/javascript; charset=utf-8' <<<"$headers"; then
    echo 'FAIL: checkout.mjs is not served with JavaScript MIME type'
    exit 1
fi
echo 'OK: checkout.mjs JavaScript MIME type'

echo "All smoke checks passed."

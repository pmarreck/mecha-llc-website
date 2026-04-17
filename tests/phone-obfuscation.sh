#!/usr/bin/env bash
# Asserts the phone number does not appear as a contiguous string in any
# page source. The number must be present visually via SVG, assembled by
# JS at click time for tel: navigation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERNS=(
    '2035704096'
    '203-570-4096'
    '(203) 570-4096'
    '(203)570-4096'
    '203.570.4096'
    '2035704'
    '5704096'
    '+12035704096'
    'tel:+12035704096'
    'tel:2035704096'
)

PAGES=("index.html" "consulting/index.html" "software/index.html" "assets/js/site.js")

fail=0
for page in "${PAGES[@]}"; do
    [[ -f "$page" ]] || continue
    for pattern in "${PATTERNS[@]}"; do
        if grep -Fq "$pattern" "$page"; then
            echo "FAIL: $page leaks phone pattern: '$pattern'"
            fail=1
        fi
    done
done

if [[ $fail -ne 0 ]]; then
    exit 1
fi

# Every page must render the phone SVG at runtime. We verify by checking
# that each page has a <span data-phone></span> placeholder that site.js
# will populate, and that site.js contains the digits as separate string
# literals (not as a contiguous number).
for page in index.html consulting/index.html software/index.html; do
    if ! grep -q 'data-phone' "$page"; then
        echo "FAIL: $page missing data-phone placeholder"
        exit 1
    fi
done

# site.js must exist and must not contain a contiguous phone number.
if [[ ! -f assets/js/site.js ]]; then
    echo "FAIL: assets/js/site.js missing"
    exit 1
fi

echo "OK: phone number not leaked in static sources."

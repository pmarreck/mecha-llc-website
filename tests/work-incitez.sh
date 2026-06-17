#!/usr/bin/env bash
# Asserts the incitez showcase carries the MFIC-honest story + the VERIFIED numbers,
# leads with verified parity, links the live demo, and now (BSL confirmed public)
# links the GitHub repo. Guards two ways:
#   1. the repo link is present (BUSL-1.1 verified public 2026-06-17), and
#   2. NO unverified speed multiplier ("31×"/"50×") appears on ANY page — incitez is
#      re-measuring a defensible figure; until it lands, speed stays qualitative.
#      (MFIC applied to our own marketing: a skeptic re-running it must not catch us.)
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PAGE=work/incitez/index.html
fail=0
note() { echo "FAIL: $1"; fail=1; }
[ -f "$PAGE" ] || { echo "FAIL: missing $PAGE"; exit 1; }
need() { grep -qiF -- "$2" "$1" || note "$PAGE missing $3"; }

# Story + honest framing (verified parity leads).
need "$PAGE" 'incitez'  'product name'
need "$PAGE" 'eyecite'  'the standard it is compared to'
need "$PAGE" 'verified' 'the verified-parity framing'
need "$PAGE" 'parity'   'parity language'

# VERIFIED numbers only (parity + attribution; speed multiplier is held).
need "$PAGE" '324'     'citation parity count (324=324)'
need "$PAGE" '215/215' 'differential gate'
need "$PAGE" '350'     'browser-demo citation count'
need "$PAGE" '183'     'cleanly-attributed parties'

# Speed is still featured, but qualitatively (no hard multiple yet).
grep -qiE 'faster' "$PAGE" || note "$PAGE should still describe incitez as faster (qualitatively)"

# Honest caveat — surpass only where structure is reliable.
grep -qiE 'where the structure|where structure|structure (allows|is reliable)' "$PAGE" || note "$PAGE missing the 'only where structure is reliable' caveat"

# Live demo + (now unblocked) GitHub repo.
need "$PAGE" 'incitez-web.pages.dev'       'live demo link'
need "$PAGE" 'github.com/pmarreck/incitez' 'GitHub repo link (BSL now public)'

# GATE (site-wide): no unverified speed multiplier on ANY tracked page until incitez
# reports the verified figure. Forbid "<digit>×" / "<digit>&times;" / "<digit>x faster".
if command -v jj >/dev/null 2>&1 && [ -d .jj ]; then mapfile -t PAGES < <(jj file list | grep -E '\.html$'); else mapfile -t PAGES < <(git ls-files '*.html'); fi
for p in "${PAGES[@]}"; do
	[ -f "$p" ] || continue
	if grep -qE '[0-9][[:space:]]*(&times;|×)|[0-9]+[[:space:]]*x[[:space:]]+faster' "$p"; then
		note "$p contains an unverified speed multiplier (held until incitez reports the figure)"
	fi
done

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "OK: incitez showcase — verified numbers, qualitative speed, demo + repo linked, no unverified multiplier."

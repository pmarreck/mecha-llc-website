#!/usr/bin/env bash
# Asserts the incitez showcase page carries the MFIC-honest story + the measured
# numbers Einstein supplied, leads with verified parity, links the live demo, and
# — critically — does NOT link the incitez GitHub repo while its PUBLIC license is
# still proprietary (the repo link is gated on the BSL landing; see PLAN).
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

# Measured numbers (MFIC-honest; no overclaiming).
need "$PAGE" '324'     'citation parity count (324=324)'
need "$PAGE" '215/215' 'differential gate'
need "$PAGE" '31'      'speed multiple (~31x)'
need "$PAGE" '966'      'baseline ms (966ms→31ms)'
need "$PAGE" '350'     'browser-demo citation count'
need "$PAGE" '183'     'cleanly-attributed parties'

# Honest caveat — the surpass is only where structure is reliable.
grep -qiE 'where the structure|where structure|structure (allows|is reliable)' "$PAGE" || note "$PAGE missing the 'only where structure is reliable' caveat"

# Live demo is linked.
need "$PAGE" 'incitez-web.pages.dev' 'live demo link'

# GATE: the incitez GitHub repo must NOT be linked while its public LICENSE is
# proprietary. Flip this assertion (and add the link) only after BSL is committed.
if grep -qiF 'github.com/pmarreck/incitez' "$PAGE"; then
	note "$PAGE links the incitez GitHub repo, but BSL is not confirmed public yet (gate)"
fi

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "OK: incitez showcase present, honest framing, demo linked, repo link correctly gated."

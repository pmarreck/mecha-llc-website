#!/usr/bin/env bash
# Asserts the incitez showcase: MFIC-honest story, verified numbers, demo + (BSL)
# repo links, and a RETUNED speed-multiplier gate.
#
# Speed gate (MFIC on our own marketing): the verified figures are conditioned and
# two-regime — ~31× warm/full-brief, ~64× cold/one-shot. APPROVED_MULTIPLIERS below
# is the SINGLE SOURCE OF TRUTH. The gate (1) requires both approved figures on the
# incitez page and (2) fails the suite if ANY page carries a multiplier outside the
# allowlist — so a future unconditioned "50×"/"60×" still trips it.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Single source of truth for approved, verified, conditioned speed multipliers.
APPROVED_MULTIPLIERS=(31 64)

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

# Verified parity + attribution numbers.
need "$PAGE" '324'     'citation parity count (324=324)'
need "$PAGE" '215/215' 'differential gate'
need "$PAGE" '350'     'browser-demo citation count'
need "$PAGE" '183'     'cleanly-attributed parties'

# Honest caveat — surpass only where structure is reliable.
grep -qiE 'where the structure|where structure|structure (allows|is reliable)' "$PAGE" || note "$PAGE missing the 'only where structure is reliable' caveat"

# Live demo + (BSL public) GitHub repo.
need "$PAGE" 'incitez-web.pages.dev'       'live demo link'
need "$PAGE" 'github.com/pmarreck/incitez' 'GitHub repo link'

# Both approved, conditioned speed figures must be present + labeled on the incitez page.
for m in "${APPROVED_MULTIPLIERS[@]}"; do
	grep -qE "${m}[[:space:]]*(&times;|×)" "$PAGE" || note "$PAGE missing the approved ~${m}× figure"
done
grep -qiE 'warm|engine-only' "$PAGE" || note "$PAGE missing the warm/engine-only regime label"
grep -qiE 'one-shot|single run|cold' "$PAGE" || note "$PAGE missing the cold/one-shot regime label"

# Allowlist gate over ALL pages: no multiplier outside APPROVED_MULTIPLIERS.
in_allowlist() { local n="$1" a; for a in "${APPROVED_MULTIPLIERS[@]}"; do [ "$n" = "$a" ] && return 0; done; return 1; }
if command -v jj >/dev/null 2>&1 && [ -d .jj ]; then mapfile -t PAGES < <(jj file list | grep -E '\.html$'); else mapfile -t PAGES < <(git ls-files '*.html'); fi
for p in "${PAGES[@]}"; do
	[ -f "$p" ] || continue
	while IFS= read -r tok; do
		[ -z "$tok" ] && continue
		n="$(printf '%s' "$tok" | grep -oE '^[0-9]+')"
		in_allowlist "$n" || note "$p has a non-approved speed multiplier '${n}×' (allowed: ${APPROVED_MULTIPLIERS[*]})"
	done < <(grep -oE '[0-9]+[[:space:]]*(&times;|×|x[[:space:]]+faster)' "$p")
done

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "OK: incitez showcase — verified parity, conditioned ~31×/~64× speed (allowlisted), demo + repo linked."

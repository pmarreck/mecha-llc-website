#!/usr/bin/env bash
# Asserts the MFIC thought-leadership page is buyer-framed on top (assurance /
# Sarbanes-Oxley lineage), inlines the core methodology (rendered from MFIC.md),
# links the gist for the technical deep dive, and cross-links incitez + consulting.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PAGE=thoughts/mfic/index.html
fail=0
note() { echo "FAIL: $1"; fail=1; }
[ -f "$PAGE" ] || { echo "FAIL: missing $PAGE (run scripts/render-mfic)"; exit 1; }
need() { grep -qiF -- "$2" "$1" || note "$PAGE missing $3"; }

# Buyer framing on top.
need "$PAGE" 'Sarbanes-Oxley' 'the SOX lineage'
need "$PAGE" 'assurance'      'the assurance framing'
need "$PAGE" 'MFIC'           'the methodology name'

# Core methodology, inline (rendered from MFIC.md): the four load-bearing words + litmus.
need "$PAGE" 'Mechanically' 'the M word'
need "$PAGE" 'Falsifiable'  'the F word'
need "$PAGE" 'Independent'  'the I word'
need "$PAGE" 'Control'      'the C word'
need "$PAGE" 'differential' 'differential-oracle mention'
grep -qiE 'segregation of duties' "$PAGE" || note "$PAGE missing segregation-of-duties (the SOX tie-in)"

# Deep dive linked to the gist (not inlined).
need "$PAGE" 'gist.github.com' 'the gist deep-dive link'

# Cross-links: MFIC (why) <-> incitez (proof), and the consulting practice.
need "$PAGE" '/work/incitez/' 'cross-link to the incitez proof'
need "$PAGE" '/consulting/'   'cross-link to consulting'

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "OK: MFIC page buyer-framed, core inline, deep dive linked, cross-linked."

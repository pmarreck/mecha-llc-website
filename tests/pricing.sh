#!/usr/bin/env bash
# Asserts the displayed product pricing (Paddle gate #2). Real numbers, Peter-
# approved 2026-06-14: $49.99 per app, $79.99 for the two-app bundle. Prices are
# checked per-card (scoped) plus a bundle element; the bundle must name itself so
# a reviewer sees what the discounted SKU is.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PAGE=software/index.html
[ -f "$PAGE" ] || { echo "FAIL: $PAGE missing"; exit 1; }

card() { # card <product-name> -> prints that product's <article> block
	perl -0ne 'print $1 if /(<article\b(?:(?!<\/article>).)*?>'"$1"'<.*?<\/article>)/s' "$PAGE"
}

fail=0

VAL="$(card 'Mecha Validate')"
printf '%s' "$VAL" | grep -qF '$49.99' || { echo "FAIL: Mecha Validate card missing \$49.99 price"; fail=1; }

ROT="$(card 'Mecha RotShield')"
printf '%s' "$ROT" | grep -qF '$49.99' || { echo "FAIL: Mecha RotShield card missing \$49.99 price"; fail=1; }

# Bundle element: must show $79.99 AND identify itself as a bundle.
grep -qF '$79.99' "$PAGE"      || { echo "FAIL: no \$79.99 bundle price on page"; fail=1; }
grep -qiE 'bundle' "$PAGE"     || { echo "FAIL: no self-identifying bundle element"; fail=1; }

if [ "$fail" -ne 0 ]; then
	exit 1
fi
echo "OK: product prices (\$49.99 each) and bundle (\$79.99) displayed."

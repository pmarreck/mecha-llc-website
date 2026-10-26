#!/usr/bin/env bash
# Asserts the approved displayed product pricing (Paddle gate #2):
# Validate $49.99, RotShield $29.99, their bundle $64.99, and BeamFlix $34.99. Prices are
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
printf '%s' "$ROT" | grep -qF '$29.99' || { echo "FAIL: Mecha RotShield card missing \$29.99 price"; fail=1; }

BEAM="$(card 'Mecha BeamFlix')"
printf '%s' "$BEAM" | grep -qF '$34.99' || { echo "FAIL: Mecha BeamFlix card missing \$34.99 price"; fail=1; }

# Bundle element: must show $64.99 AND identify itself as a bundle.
grep -qF '$64.99' "$PAGE"      || { echo "FAIL: no \$64.99 bundle price on page"; fail=1; }
grep -qF 'Save $14.99' "$PAGE" || { echo 'FAIL: incorrect bundle savings'; fail=1; }
grep -qiE 'bundle' "$PAGE"     || { echo "FAIL: no self-identifying bundle element"; fail=1; }

if [ "$fail" -ne 0 ]; then
	exit 1
fi
echo "OK: Validate (\$49.99), RotShield (\$29.99), BeamFlix (\$34.99), and bundle (\$64.99, saving \$14.99) displayed."

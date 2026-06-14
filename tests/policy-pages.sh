#!/usr/bin/env bash
# Asserts the Paddle-required legal/policy surfaces exist with real (not
# placeholder) content: Refund, Terms, Privacy, Contact. Paddle manually
# reviews the seller site before approval and bounces sellers lacking these.
# Markers are content fingerprints, not full text — they prove the page is
# the right page with its load-bearing sections present.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0
note() { echo "FAIL: $1"; fail=1; }

need_file() { [ -f "$1" ] || note "missing page: $1"; }
need_in()   { # need_in <file> <grep-pattern> <human-desc>
	[ -f "$1" ] && grep -qi -- "$2" "$1" || note "$1 missing $3"
}

# --- Terms of Service ---
TERMS=legal/terms/index.html
need_file "$TERMS"
need_in "$TERMS" 'Terms of Service' 'ToS heading'
need_in "$TERMS" 'Mecha, LLC'       'legal entity name'
need_in "$TERMS" 'governing law'    'governing-law clause'
need_in "$TERMS" 'Paddle'           'merchant-of-record disclosure'

# --- Privacy Policy ---
PRIV=legal/privacy/index.html
need_file "$PRIV"
need_in "$PRIV" 'Privacy Policy' 'privacy heading'
need_in "$PRIV" 'Paddle'         'payment-processor disclosure'
need_in "$PRIV" 'personal'       'personal-data discussion'

# --- Refund / Returns ---
REF=legal/refund/index.html
need_file "$REF"
need_in "$REF" 'Refund'  'refund heading'
need_in "$REF" '30'      '30-day window'
need_in "$REF" 'Paddle'  'MoR refund-handling disclosure'

# --- Contact ---
CON=contact/index.html
need_file "$CON"
need_in "$CON" 'Contact'      'contact heading'
need_in "$CON" 'mailto:'      'email contact method'
need_in "$CON" 'data-phone'   'phone placeholder (obfuscated)'

# --- "What is being sold" statement (Paddle requirement #3) ---
# Must appear somewhere a reviewer will see it: software index or a product page.
SELL_PAGES=(software/index.html validate/index.html rotshield/index.html)
sold=0
for p in "${SELL_PAGES[@]}"; do
	[ -f "$p" ] || continue
	if grep -qi 'downloadable' "$p" && grep -qiE 'macOS|Windows' "$p"; then
		sold=1; break
	fi
done
[ "$sold" -eq 1 ] || note 'no page clearly states downloadable software + supported platforms'

if [ "$fail" -ne 0 ]; then
	exit 1
fi
echo "OK: policy pages present with required sections."

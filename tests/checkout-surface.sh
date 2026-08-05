#!/usr/bin/env bash
# Static-page contract: honest capability boundary, no-JS-safe disabled CTA,
# accessibility, published prices/policies, and no frontend server secret names.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PAGE=software/index.html
fail=0
note() { echo "FAIL: $1"; fail=1; }
need() { grep -qiE -- "$1" "$PAGE" || note "$2"; }

# Claims are a classifier over every published HTML page, not a one-page spot check.
mapfile -t pages < <(rg --files -g '*.html')
for page in "${pages[@]}"; do
	grep -qiE 'every common file format|240\+' "$page" && note "$page contains an unmeasured universal/240+ format claim"
done

for state in strict partial structural-only unsupported; do
	need "$state" "capability boundary missing '$state' state"
done
need 'measured corruption-detection evidence' 'capability boundary missing measured evidence'
need 'capability matrix' 'capability boundary missing future matrix source'

# Literal HTML stays safe when JavaScript is absent or fails before Paddle loads.
perl -0ne 'exit 0 if /<button\b(?=[^>]*data-checkout-product="validate")(?=[^>]*\bdisabled\b)[^>]*>/s; exit 1' "$PAGE" \
	|| note 'Validate checkout button is not disabled in source HTML'
need '<noscript>' 'no-JavaScript fallback missing'
perl -0ne 'exit 0 if /\.reveal\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/s; exit 1' assets/css/site.css \
	|| note 'no-JavaScript page content remains hidden by reveal styles'
need 'aria-describedby="validate-checkout-status"' 'checkout button lacks status description'
need 'id="validate-checkout-status"[^>]+role="status"[^>]+aria-live="polite"' 'checkout status is not an accessible live region'
need '\$49\.99' 'Validate CTA does not show the approved price'
need '/legal/terms/' 'checkout surface lacks Terms link'
need '/legal/privacy/' 'checkout surface lacks Privacy link'
need '/legal/refund/' 'checkout surface lacks Refund link'

# Server-only credential identifiers must never enter frontend HTML/JavaScript.
mapfile -t frontend < <(rg --files -g '*.html' -g 'assets/js/*.js' -g 'assets/js/*.mjs')
for file in "${frontend[@]}"; do
	grep -qE 'PADDLE_API_KEY|PADDLE_WEBHOOK_SECRET|RESEND_API_KEY|SIGNING_KEYS|BEGIN [A-Z ]*PRIVATE KEY' "$file" \
		&& note "$file contains a server-only credential identifier"
done

# Mobile layout must make the CTA usable without horizontal button overflow.
grep -qE '@media \(max-width: 640px\)' assets/css/site.css || note 'mobile breakpoint missing'
grep -qE '\.checkout-actions.*width: 100%' assets/css/site.css || note 'mobile checkout button width rule missing'

[ "$fail" -eq 0 ] || exit "$fail"
echo 'OK: capability boundary and disabled checkout surface are honest, accessible, no-JS-safe, mobile-safe, and secret-free.'

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

grep -qiE 'before checkout opens|launch gates|capability matrix|Paddle fulfillment|Published policies currently|configuration is incomplete|No payment can be taken' "$PAGE" \
	&& note 'public sales page exposes internal checkout readiness details'

# Literal HTML stays safe when JavaScript is absent or fails before Paddle loads.
perl -0ne 'exit 0 if /<button\b(?=[^>]*data-checkout-product="validate")(?=[^>]*\bdisabled\b)[^>]*>/s; exit 1' "$PAGE" \
	|| note 'Validate checkout button is not disabled in source HTML'
perl -0ne 'exit 0 if /\.reveal\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/s; exit 1' assets/css/site.css \
	|| note 'no-JavaScript page content remains hidden by reveal styles'
need 'aria-describedby="validate-checkout-status"' 'checkout button lacks status description'
need 'id="validate-checkout-status"[^>]+role="status"[^>]+aria-live="polite"' 'checkout status is not an accessible live region'
need '\$49\.99' 'Validate CTA does not show the approved price'
node --input-type=module <<'JS' || note 'an app checkout placeholder is missing or unsafe'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html = readFileSync('software/index.html', 'utf8');
const cards = [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);
for (const [name, price] of [['Mecha BeamFlix', '34.99'], ['Mecha Validate', '49.99'], ['Mecha RotShield', '29.99']]) {
	const card = cards.find(value => value.includes(`<h3>${name}</h3>`));
	assert.ok(card, `${name}: card missing`);
	const button = card.match(/<button\b[^>]*>[\s\S]*?<\/button>/)?.[0];
	assert.ok(button, `${name}: checkout button missing`);
	assert.match(button, /\sdisabled(?:\s|>)/, `${name}: must be natively disabled`);
	assert.match(button, /aria-disabled="true"/, `${name}: disabled state missing`);
	assert.ok(button.includes(`Checkout not yet available — $${price}`), `${name}: wrong checkout label/price`);
	assert.ok(card.includes('class="checkout-actions"'), `${name}: disabled cursor styling missing`);
}
const bundle = html.match(/<section class="bundle[^\"]*">[\s\S]*?<\/section>/)?.[0];
assert.ok(bundle, 'bundle offer missing');
assert.match(bundle, /<button\b(?=[^>]*id="bundle-checkout")(?=[^>]*data-checkout-product="bundle")(?=[^>]*\sdisabled(?:\s|>))[^>]*>Checkout not yet available — \$64\.99<\/button>/);
assert.match(readFileSync('assets/css/site.css', 'utf8'), /\.checkout-actions\s+\.btn\[disabled\]\s*\{[^}]*cursor:\s*not-allowed\s*;/);
JS
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

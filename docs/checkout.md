# Checkout boundary

The public site ships with checkout disabled. Its literal HTML button remains disabled
when JavaScript is unavailable, configuration is incomplete, Paddle.js fails to load,
or Paddle rejects initialization.

`assets/js/checkout-config.mjs` is the only public configuration surface. Enabling it
requires one coherent set:

- `sandbox` plus a `test_...` client-side token, or `live` plus a `live_...` token;
- public `pri_...` IDs for Validate, RotShield, and their bundle;
- a verified semantic capability-matrix version and exact 40-character Validate commit.

Partial price sets, token/environment mismatches, unknown fields, missing matrix proof,
and malformed IDs classify as invalid. Disabled and invalid states never request the
Paddle CDN. Server credentials have no frontend configuration field.

When enabled after owner approval, the adapter loads Paddle.js from its fixed official
CDN URL, initializes once, and opens an overlay containing one configured price and
quantity. `checkout.completed` updates an accessible status message, but it does not
claim fulfillment. Paddle sends the receipt; the authenticated Commerce webhook owns
license signing/email, and verified release infrastructure owns download instructions.
Closing or failing checkout leaves the button recoverable.

Current primary references:

- https://developer.paddle.com/paddle-js/about/
- https://developer.paddle.com/paddle-js/about/include-paddlejs/
- https://developer.paddle.com/paddle-js/about/client-side-tokens/
- https://developer.paddle.com/paddle-js/methods/paddle-checkout-open/
- https://developer.paddle.com/paddle-js/events/
- https://developer.paddle.com/paddle-js/events/checkout-completed/

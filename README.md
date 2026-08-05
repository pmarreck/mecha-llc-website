# Mecha LLC Website

[![Mechatron Prime CI](https://img.shields.io/endpoint?url=https%3A%2F%2Fthelio-nixos.tail66c90.ts.net%2Fbadges%2Fmecha-llc-website.json&style=for-the-badge)](https://thelio-nixos.tail66c90.ts.net/mechatron-prime/)

Static site for [mecha.llc](https://mecha.llc), served by GitHub Pages from this repo.

## Local preview

```
./server.lua           # default port 8080
PORT=8000 ./server.lua # override
```

Requires LuaJIT with `luasocket` and `luafilesystem`.

```
./build                # syntax and required-entrypoint checks
./test                 # complete static, policy, checkout, and preview suite
```

The Paddle checkout source is deliberately disabled. `assets/js/checkout-config.mjs`
must contain one complete public client-token/price set and a verified Validate
capability-matrix commit before the adapter can load Paddle.js or enable a button.
See `docs/checkout.md` for the configuration classifier, no-JavaScript behavior,
fulfillment boundary, and official Paddle references.

## Structure

- `index.html`, `consulting/index.html`, `software/index.html` — the three pages
- `assets/css/site.css`, `assets/js/site.js` — shared styles and scripts
- `assets/img/` — app icons and favicon
- `CNAME` — custom domain for GitHub Pages

See `docs/superpowers/specs/` for the design spec and `docs/superpowers/plans/` for the implementation plan.

## Deployment

Pushed to `yolo` branch, served by GitHub Pages. Custom domain configured via DNS A records at the registrar.

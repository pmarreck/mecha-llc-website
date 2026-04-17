# Mecha LLC Website

Static site for [mecha.llc](https://mecha.llc), served by GitHub Pages from this repo.

## Local preview

```
./server.lua           # default port 8080
PORT=8000 ./server.lua # override
```

Requires LuaJIT with `luasocket` and `luafilesystem`.

## Structure

- `index.html`, `consulting/index.html`, `software/index.html` — the three pages
- `assets/css/site.css`, `assets/js/site.js` — shared styles and scripts
- `assets/img/` — app icons and favicon
- `CNAME` — custom domain for GitHub Pages

See `docs/superpowers/specs/` for the design spec and `docs/superpowers/plans/` for the implementation plan.

## Deployment

Pushed to `yolo` branch, served by GitHub Pages. Custom domain configured via DNS A records at the registrar.

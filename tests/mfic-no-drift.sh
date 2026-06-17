#!/usr/bin/env bash
# Drift guard (MFIC applied to the MFIC page): re-render from the canonical
# ~/Documents/MFIC.md and assert the COMMITTED page matches. Catches both a
# stale committed page (MFIC.md changed, page not regenerated) and a hand-edited
# page that diverged from the source. The verdict comes from the source + the
# generator, not from anyone's claim that they're in sync.
#
# SKIPS (does not fail) when the canonical source or pandoc isn't present — e.g.
# a clone without the home-dir file. The committed artifact is what ships; this
# gate only bites where the source IS available to compare against.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SRC="${MFIC_SRC:-$HOME/Documents/MFIC.md}"
COMMITTED=thoughts/mfic/index.html

[ -f "$SRC" ] || { echo "SKIP: canonical MFIC.md not present ($SRC) — drift check skipped"; exit 0; }
command -v pandoc >/dev/null 2>&1 || { echo "SKIP: pandoc not present — drift check skipped"; exit 0; }
[ -f "$COMMITTED" ] || { echo "FAIL: $COMMITTED missing (run scripts/render-mfic)"; exit 1; }

tmp="$(mktemp)"
MFIC_OUT="$tmp" ./scripts/render-mfic >/dev/null 2>&1
if diff -q "$tmp" "$COMMITTED" >/dev/null 2>&1; then
	rm -f "$tmp"
	echo "OK: MFIC page is in sync with canonical MFIC.md (no drift)."
else
	echo "FAIL: $COMMITTED has DRIFTED from $SRC — run ./scripts/render-mfic and commit."
	diff "$COMMITTED" "$tmp" | head -20
	rm -f "$tmp"
	exit 1
fi

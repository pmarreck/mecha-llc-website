#!/usr/bin/env bash
# Classifier over the SET of all served HTML pages: every page must carry the
# canonical footer linking all four legal/contact surfaces. Paddle requires the
# policies linked from the footer of every page. This guards against drift when
# pages are hand-copied (no server-side includes on GitHub Pages).
#
# This is a set-based classifier (per RULES): it enumerates the whole population
# of served pages and asserts the property holds for ALL of them — not a
# spot-check of a hand-picked few.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Population = every tracked .html file (tracked ⇒ served by Pages).
if command -v jj >/dev/null 2>&1 && [ -d .jj ]; then
	mapfile -t PAGES < <(jj file list | grep -E '\.html$')
else
	mapfile -t PAGES < <(git ls-files '*.html')
fi

REQUIRED_LINKS=(
	'/legal/terms/'
	'/legal/privacy/'
	'/legal/refund/'
	'/contact/'
)

fail=0
checked=0
for page in "${PAGES[@]}"; do
	[ -f "$page" ] || continue
	checked=$((checked + 1))
	for link in "${REQUIRED_LINKS[@]}"; do
		if ! grep -qF "href=\"$link\"" "$page"; then
			echo "FAIL: $page footer missing link to $link"
			fail=1
		fi
	done
done

if [ "$checked" -eq 0 ]; then
	echo "FAIL: no HTML pages found to check"
	fail=1
fi

if [ "$fail" -ne 0 ]; then
	exit 1
fi
echo "OK: all $checked HTML pages link every legal/contact surface in their footer."

#!/usr/bin/env bash
# Asserts the Mecha Validate representation conveys its open-core model, scoped
# to the Validate product card (not the page at large — RotShield also says
# "commercial", so a page-wide grep would pass falsely). The model, per Peter
# (2026-06-14): the CLI + library are open source and free; a commercial GUI app
# is the paid product; the open-source license reserves graphical/commercial
# frontend rights to Mecha, LLC (only Mecha may ship a GUI).
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PAGE=software/index.html
[ -f "$PAGE" ] || { echo "FAIL: $PAGE missing"; exit 1; }

# Isolate the <article>…</article> block that contains the Mecha Validate heading.
BLOCK="$(perl -0ne 'print $1 if /(<article\b(?:(?!<\/article>).)*?>Mecha Validate<.*?<\/article>)/s' "$PAGE")"
if [ -z "$BLOCK" ]; then
	echo "FAIL: could not locate the Mecha Validate product card"
	exit 1
fi

fail=0
has() { # has <regex> <human-desc>
	printf '%s' "$BLOCK" | grep -qiE -- "$1" || { echo "FAIL: Validate card missing $2"; fail=1; }
}

has 'open[- ]source'        'the open-source claim'
has '\bCLI\b|library'       'the free CLI/library mention'
has 'commercial'            'the commercial (paid) qualifier'
has '\bGUI\b'               'the GUI app mention'
has 'reserv'               'the reserved-rights clause'
# Reserved rights must name the entity they are reserved to.
has 'Mecha'                 'the reserving entity (Mecha, LLC)'

if [ "$fail" -ne 0 ]; then
	exit 1
fi
echo "OK: Mecha Validate card conveys the open-core model (free CLI/lib, paid GUI, reserved rights)."

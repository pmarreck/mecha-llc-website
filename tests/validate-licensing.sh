#!/usr/bin/env bash
# Check the current commercial license policy within the Validate card.
# Other products' licensing statements cannot satisfy this contract.
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

has 'commercial' 'commercial software status'
has 'license is required' 'required license'
has 'graphical app' 'graphical interface coverage'
has 'command-line' 'command-line coverage'
has 'validation core' 'core coverage'
has 'closed.source' 'current closed-source status'
if printf '%s' "$BLOCK" | grep -qiE 'source[- ]available|Business Source|library free|CLI[^<]*free|github.com/pmarreck/validate'; then
	echo 'FAIL: Validate card still advertises obsolete source access or free components'
	fail=1
fi

if [ "$fail" -ne 0 ]; then
	exit 1
fi
echo "OK: Mecha Validate requires a license across interfaces and the core, without obsolete source/free claims."

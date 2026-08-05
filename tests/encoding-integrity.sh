#!/usr/bin/env bash
# Classifier over the SET of all tracked text files: none may contain
# double-(or triple-)encoded UTF-8 ("mojibake"). This class of bug appears when
# a byte-level edit (e.g. perl/sed on a UTF-8 file) re-encodes an already-UTF-8
# multi-byte char, turning "·" into "Â·" / "ÃÂ·" and "—" into "Ã¢ÂÂ".
# Since this is a PUBLIC site where every tracked file is served verbatim, a
# corrupted glyph ships straight to visitors (and into the <title> bar).
#
# Detection fingerprint: double-encoded UTF-8 ALWAYS produces a lead byte
# Â(C3 82)/â(C3 A2)/Ã(C3 83) immediately followed by a C2/C3-prefixed
# continuation pair. That sequence essentially never occurs in legitimate
# English+punctuation content, so it's a low-false-positive signature for
# middot, en/em-dash, smart quotes, arrows — every punctuation mark this site
# uses. (LC_ALL=C so grep works on raw bytes.)
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v jj >/dev/null 2>&1 && [ -d .jj ]; then
	mapfile -t FILES < <(jj file list | grep -E '\.(html|css|js|svg|md|txt|json)$')
elif git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	mapfile -t FILES < <(git ls-files '*.html' '*.css' '*.js' '*.mjs' '*.svg' '*.md' '*.txt' '*.json')
else
	mapfile -t FILES < <(rg --files -g '*.html' -g '*.css' -g '*.js' -g '*.mjs' -g '*.svg' -g '*.md' -g '*.txt' -g '*.json')
fi

# Mojibake fingerprint: (Â|â|Ã) + (C2|C3)-led continuation.
PATTERN='\xc3[\x82\x83\xa2][\xc2\xc3]'

fail=0
for f in "${FILES[@]}"; do
	[ -f "$f" ] || continue
	if LC_ALL=C grep -aqP "$PATTERN" "$f" 2>/dev/null; then
		echo "FAIL: $f contains double-encoded UTF-8 (mojibake). Offending lines:"
		LC_ALL=C grep -anP "$PATTERN" "$f" 2>/dev/null | head -5 | sed 's/^/    /'
		fail=1
	fi
done

if [ "$fail" -ne 0 ]; then
	echo "Fix: replace the mangled bytes with the correct character (or its HTML entity, e.g. &middot; / &mdash;)."
	exit 1
fi
echo "OK: no double-encoded UTF-8 in any tracked text file ($((${#FILES[@]})) scanned)."

#!/usr/bin/env bash
# Asserts the phone number never appears as a contiguous machine-readable
# string in ANY tracked file (tracked ⇒ published: the repo is public AND
# every tracked file is served verbatim at mecha.llc/<path> by GitHub Pages).
# The number must be present only visually via SVG, assembled by JS at
# click time for tel: navigation.
#
# The patterns below are CONSTRUCTED AT RUNTIME from fragments so that this
# file itself never contains a contiguous, harvestable form. (Its previous
# version embedded the plaintext number ten ways — the control was the leak.)
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Fragments — never concatenated on disk, only in memory at test time.
cc="1"
area="203"
mid="570"
last="4096"

PATTERNS=(
	"${area}${mid}${last}"
	"${area}-${mid}-${last}"
	"(${area}) ${mid}-${last}"
	"(${area})${mid}-${last}"
	"${area}.${mid}.${last}"
	"${area}${mid}${last:0:1}"
	"${mid}${last}"
	"+${cc}${area}${mid}${last}"
	"tel:+${cc}${area}${mid}${last}"
	"tel:${area}${mid}${last}"
)

# The publication set: every tracked file. jj is canonical here; fall back
# to git ls-files for environments without jj (e.g. a bare CI checkout).
if command -v jj >/dev/null 2>&1 && [ -d .jj ]; then
	FILES="$(jj file list)"
else
	FILES="$(git ls-files)"
fi

fail=0
while IFS= read -r file; do
	[ -f "$file" ] || continue
	for pattern in "${PATTERNS[@]}"; do
		# -a: treat binaries as text too (catches EXIF/metadata leaks in images)
		if grep -aFq -- "$pattern" "$file"; then
			echo "FAIL: tracked file '$file' leaks a contiguous phone pattern"
			fail=1
		fi
	done
done <<< "$FILES"

# Every page must still render the phone SVG at runtime: each page needs a
# <span data-phone></span> placeholder that site.js populates.
for page in index.html consulting/index.html software/index.html; do
	if ! grep -q 'data-phone' "$page"; then
		echo "FAIL: $page missing data-phone placeholder"
		fail=1
	fi
done

if [ ! -f assets/js/site.js ]; then
	echo "FAIL: assets/js/site.js missing"
	fail=1
fi

if [ "$fail" -ne 0 ]; then
	exit 1
fi

echo "OK: phone number not leaked in any tracked (published) file."

#!/usr/bin/env bash
# Set-classifier over served HTML: enforce the FINALIZED product brand names
# and prove the RETIRED/SHELVED names appear NOWHERE published. Finalized
# (2026-06-14, Peter): "Mecha Validate", "Mecha RotShield". Mecha Archiver is
# SHELVED (market overlap w/ PowerArchiver + bit-exact DEFLATE re-emission is
# intractable), so its app names must not appear as live products.
#
# This is a classifier over the whole population of pages, not a spot check:
# RETIRED names are tested for absence across EVERY tracked HTML file.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v jj >/dev/null 2>&1 && [ -d .jj ]; then
	mapfile -t PAGES < <(jj file list | grep -E '\.html$')
elif git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	mapfile -t PAGES < <(git ls-files '*.html')
else
	mapfile -t PAGES < <(rg --files -g '*.html')
fi

# Retired display names that must not appear on ANY served page.
RETIRED=(
	'Entropy Shield'
	'BLIP Archiver'
	'Mecha Archiver'
)

# Finalized names that must appear on AT LEAST ONE served page.
FINALIZED=(
	'Mecha Validate'
	'Mecha RotShield'
)

fail=0

# Absence across the whole set.
for page in "${PAGES[@]}"; do
	[ -f "$page" ] || continue
	for name in "${RETIRED[@]}"; do
		if grep -qF -- "$name" "$page"; then
			echo "FAIL: $page still contains retired product name '$name'"
			fail=1
		fi
	done
done

# Presence somewhere in the set.
for name in "${FINALIZED[@]}"; do
	hits=0
	for page in "${PAGES[@]}"; do
		[ -f "$page" ] && grep -qF -- "$name" "$page" && hits=1 && break
	done
	[ "$hits" -eq 1 ] || { echo "FAIL: finalized name '$name' appears on no served page"; fail=1; }
done

if [ "$fail" -ne 0 ]; then
	exit 1
fi
echo "OK: finalized product names present; retired/shelved names absent everywhere."

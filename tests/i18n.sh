#!/usr/bin/env bash
set -u
node --test tests/i18n.test.mjs
unit_status=$?
node scripts/localize.mjs --check
catalog_status=$?
if [ "$unit_status" -ne 0 ] || [ "$catalog_status" -ne 0 ]; then exit 1; fi

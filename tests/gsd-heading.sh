#!/usr/bin/env bash
set -u
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html = readFileSync('software/index.html', 'utf8');
assert.match(html, /Tools for .*GSD[\s\S]*?Validation\.<br>Bitrot prevention\.<br>Streaming video to your devices\./);
assert.match(html, /Getting stuff done, of course\./);
assert.match(html, /aria-describedby="gsd-definition"/);
assert.match(html, /id="gsd-definition" role="tooltip"/);
assert(!html.includes('Three focused apps in active development.'));
assert(!html.includes('Tools for people who care'));
JS

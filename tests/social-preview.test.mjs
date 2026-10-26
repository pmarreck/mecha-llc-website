import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pages = ['index.html', 'software/index.html', 'consulting/index.html',
	'contact/index.html', 'thoughts/mfic/index.html', 'work/incitez/index.html'];
for (const page of pages) {
	const head = readFileSync(page, 'utf8').split('</head>')[0];
	const tags = new Map();
	for (const tag of head.matchAll(/<meta\s+[^>]*>/g)) {
		const attributes = new Map([...tag[0].matchAll(/([\w:]+)="([^"]*)"/g)]
			.map(([, key, value]) => [key, value]));
		const key = attributes.get('property') ?? attributes.get('name');
		if (!key) continue;
		assert(!tags.has(key), `${page}: duplicate ${key}`);
		tags.set(key, attributes.get('content'));
	}
	for (const key of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:image:alt']) {
		assert(tags.get(key)?.trim(), `${page}: missing ${key}`);
	}
	assert.equal(tags.get('og:url'), `https://mecha.llc/${page.replace(/index\.html$/, '')}`);
	assert.equal(tags.get('twitter:card'), 'summary_large_image');
	assert.equal(tags.get('twitter:image'), tags.get('og:image'));
	assert.equal(tags.get('twitter:image:alt'), tags.get('og:image:alt'));
	assert.equal(tags.get('og:image:type'), 'image/png');
	const image = new URL(tags.get('og:image'));
	assert.equal(image.origin, 'https://mecha.llc');
	assert(image.pathname.startsWith('/assets/img/'));
	const png = readFileSync(`.${image.pathname}`);
	assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
	assert.equal(png.toString('ascii', 12, 16), 'IHDR');
	assert.equal(png.readUInt32BE(16), 1200);
	assert.equal(png.readUInt32BE(20), 630);
	assert.equal(tags.get('og:image:width'), '1200');
	assert.equal(tags.get('og:image:height'), '630');
	assert(png.length < 1024 * 1024, `${page}: preview image exceeds 1 MiB`);
}
console.log(`Social previews verified for ${pages.length} pages.`);

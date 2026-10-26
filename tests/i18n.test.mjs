import {test} from 'node:test';
import assert from 'node:assert/strict';
import {locales, normalizeLocale, chooseLocale, localizedPath, splitLocalePath} from '../assets/js/locale.mjs';
import {extract, render, validateCatalog, pages} from '../scripts/localization.mjs';
import {initializeLanguage} from '../assets/js/i18n.mjs';
import {runtimeText} from '../assets/js/messages.mjs';
import {readFileSync} from 'node:fs';
import {runtimeStrings} from '../scripts/runtime-strings.mjs';
import {translationNotice} from '../scripts/translation-policy.mjs';

test('translation notices classify every supported locale by reviewed uncertainty', () => {
	const flagged=locales.filter(l=>translationNotice(l.code,'software/index.html').machine).map(l=>l.code);
	assert.deepEqual(flagged,['am','ha','ig','ps','yo']);
	for(const {code} of locales) {
		assert.equal(translationNotice(code,'software/index.html').englishPolicy,false);
		assert.equal(translationNotice(code,'legal/terms/index.html').englishPolicy,code!=='en');
	}
	assert.throws(()=>translationNotice('unknown','index.html'),/Unsupported/);
});
test('published pages show only the selected notices and preserve legal source links', () => {
	const flagged=new Set(['am','ha','ig','ps','yo']);
	for(const {code} of locales) for(const page of pages) {
		const html=readFileSync(new URL(`../l/${code}/${page}`,import.meta.url),'utf8');
		const aside=html.match(/<aside class="translation-notice">([\s\S]*?)<\/aside>/)?.[1]??'';
		assert.equal(aside.includes(`href="/l/${code}/contact/"`),flagged.has(code),`${code}/${page}`);
		const englishLink=`href="/l/en/${page.replace(/index\.html$/,'')}"`;
		assert.equal(aside.includes(englishLink),code!=='en' && page.startsWith('legal/'),`${code}/${page}`);
	}
});

test('canonical 50 languages, regional matching and explicit script precedence', () => {
	assert.equal(locales.length, 50);
	assert.equal(new Set(locales.map(l => l.code)).size, 50);
	for (const locale of locales) assert.equal(normalizeLocale(locale.code), locale.code);
	for (const [input, expected] of Object.entries({
		'fr-CA': 'fr', 'en-US': 'en', 'fil-PH': 'fil', 'fi-FI': 'fi',
		'pt-PT': 'pt_br', 'pt_BR': 'pt_br', 'zh': 'zh_hans', 'zh-CN': 'zh_hans',
		'zh-TW': 'zh_hant', 'zh-HK': 'zh_hant', 'zh-Hans-TW': 'zh_hans',
		'zh-Hant-CN': 'zh_hant', 'iw-IL': 'he', 'no-NO': 'nb', 'xx': null,
		'filthy': null, 'english': null, '': null,
	})) assert.equal(normalizeLocale(input), expected, input);
});
test('URL wins, then saved preference, then ordered browser languages, then English', () => {
	assert.equal(chooseLocale({explicit: 'fr', saved: 'de', languages: ['ja']}), 'fr');
	assert.equal(chooseLocale({saved: 'de', languages: ['ja']}), 'de');
	assert.equal(chooseLocale({saved: 'bad', languages: ['xx', 'zh-HK', 'fr']}), 'zh_hant');
	assert.equal(chooseLocale({languages: []}), 'en');
	assert.equal(chooseLocale({explicit: 'en', languages: ['fr']}), 'en');
});
test('language switching preserves page, query and fragment, without double prefixes', () => {
	assert.equal(localizedPath('/software/?campaign=x#beamflix', 'fr'), '/l/fr/software/?campaign=x#beamflix');
	assert.equal(localizedPath('/l/fr/software/#beamflix', 'en'), '/l/en/software/#beamflix');
	assert.deepEqual(splitLocalePath('/l/zh_hant/contact/'), {locale: 'zh_hant', path: '/contact/'});
	assert.deepEqual(splitLocalePath('/software/'), {locale: null, path: '/software/'});
});
const fixture = '<!doctype html><html lang="en"><head><title>Test site</title><meta name="description" content="A test page."></head><body><nav class="site-nav"></nav><p>Hello <strong>world</strong>.</p><a href="/contact/">Contact</a><img src="/assets/a.png" alt="App icon"><script>const x="Do not translate";</script></body></html>';
test('extract whole phrases across inline markup; leave code and URLs alone', () => {
	const catalog = extract(fixture);
	assert(Object.values(catalog).includes('Hello <strong>world</strong>.'));
	assert(Object.values(catalog).includes('A test page.'));
	assert(Object.values(catalog).includes('App icon'));
	assert(!Object.values(catalog).some(s => s.includes('Do not translate')));
	assert(!Object.values(catalog).includes('/contact/'));
});
test('render translates, escapes plain attributes, localizes links, and sets RTL', () => {
	const source = extract(fixture);
	const translated = Object.fromEntries(Object.entries(source).map(([k,v]) => [k, v === 'Contact' ? 'اتصل' : v]));
	const output = render(fixture, 'contact/index.html', 'ar', translated);
	assert(output.includes('lang="ar" dir="rtl"'));
	assert(output.includes('href="/l/ar/contact/"'));
	assert(output.includes('>اتصل</a>'));
	assert(output.includes('hreflang="en"'));
	assert(output.includes('rel="canonical" href="https://mecha.llc/l/ar/contact/"'));
	assert(output.includes('src="/assets/a.png"'));
});
test('catalog safety rejects missing/extra keys, changed links and injected markup', () => {
	const source = extract(fixture);
	assert.throws(() => validateCatalog(source, {}), /keys/);
	assert.throws(() => validateCatalog(source, {...source, surprise: 'x'}), /keys/);
	const key = Object.keys(source).find(k => source[k].includes('<strong>'));
	assert.throws(() => validateCatalog(source, {...source, [key]: '<script>alert(1)</script>'}), /markup/);
	assert.throws(() => validateCatalog(source, {...source, [key]: 'x<strong onclick="x">y</strong>'}), /markup/);
	assert.throws(() => validateCatalog(source, {...source, [key]: ''}), /empty/);
});
test('browser adapter preserves links when storage throws and records picker choice', () => {
	const events={}, effects=[];
	const select={value:'',addEventListener:(name,fn)=>events[name]=fn};
	const documentObject={getElementById:()=>select};
	const windowObject={navigator:{languages:['fr-CA']},location:{pathname:'/software/',search:'?ref=test',hash:'#beamflix',replace:path=>effects.push(['redirect',path]),assign:path=>effects.push(['navigate',path])},get localStorage(){throw new Error('Denied');}};
	assert.deepEqual(initializeLanguage(documentObject,windowObject),{redirected:true,locale:'fr'});
	assert.deepEqual(effects,[['redirect','/l/fr/software/?ref=test#beamflix']]);
	windowObject.location.pathname='/l/en/software/';effects.length=0;
	assert.deepEqual(initializeLanguage(documentObject,windowObject),{redirected:false,locale:'en'});
	select.value='de';events.change();
	assert.deepEqual(effects,[['navigate','/l/de/software/?ref=test#beamflix']]);
});
test('translated checkout errors retain a searchable English original', () => {
	assert.equal(runtimeText({mechaMessages:{Failed:'Échec'}},'Failed',true),'Échec (\u2066search: Failed\u2069)');
	assert.equal(runtimeText({mechaMessages:{Ready:'Prêt'}},'Ready'),'Prêt');
});
test('picker saves an explicit choice and neutral URLs reuse it', () => {
	const events={},effects=[],storage=new Map();
	const select={value:'',addEventListener:(name,fn)=>events[name]=fn};
	const doc={getElementById:()=>select};
	const win={navigator:{languages:['fr']},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},
		location:{pathname:'/l/en/contact/',search:'',hash:'',assign:p=>effects.push(p),replace:p=>effects.push(p)}};
	initializeLanguage(doc,win);select.value='de';events.change();
	assert.equal(storage.get('mecha-language'),'de');
	assert.deepEqual(effects,['/l/de/contact/']);
	win.location.pathname='/contact/';effects.length=0;
	assert.equal(initializeLanguage(doc,win).locale,'de');
	assert.deepEqual(effects,['/l/de/contact/']);
});
test('dynamic ticker categories and checkout prose all belong to the translation registry', () => {
	const site=readFileSync(new URL('../assets/js/site.js',import.meta.url),'utf8');
	const checkout=readFileSync(new URL('../assets/js/checkout.mjs',import.meta.url),'utf8');
	const phrases=[...site.matchAll(/cat:\s*"([^"]+)"/g),...checkout.matchAll(/(?:text\(|return )'([^']+[ .…][^']*)'/g)].map(m=>m[1]);
	assert(phrases.length>20);
	for(const phrase of phrases) assert(runtimeStrings.includes(phrase),`Missing runtime translation: ${phrase}`);
});
test('catalog guards preserve product identity and numeric claims', () => {
	assert.throws(()=>validateCatalog({x:'Mecha Validate costs $49.99.'},{x:'Mecha Validate costs $29.99.'}),/numbers/);
	assert.throws(()=>validateCatalog({x:'Mecha Validate'},{x:'Mecha Valider'}),/brand/);
});
test('reviewed visible headings do not disappear into the hidden GSD definition', () => {
	for(const [code,expected] of [['ja','GSDのためのツール。'],['ko','GSD를 위한 도구.']]) {
		const catalog=JSON.parse(readFileSync(new URL(`../i18n/${code}.json`,import.meta.url)));
		const heading=catalog.s_21fceb06142db16f.split('<br>')[0]
			.replace(/<span class="term-tooltip"[^>]*>[\s\S]*?<\/span>/,'')
			.replace(/<[^>]*>/g,'');
		assert.equal(heading,expected);
	}
	for(const {code} of locales) {
		const catalog=JSON.parse(readFileSync(new URL(`../i18n/${code}.json`,import.meta.url)));
		assert.match(catalog.s_21fceb06142db16f,/<button[^>]*>GSD<\/button>/,code);
	}
});

import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pages,extract,keyFor,render,validateCatalog,escapeAttribute} from './localization.mjs';
import {locales,localizedPath} from '../assets/js/locale.mjs';
import {runtimeStrings} from './runtime-strings.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sources=Object.fromEntries(pages.map(p=>[p,readFileSync(resolve(root,p),'utf8')]));
const english=Object.assign({},...Object.values(sources).map(extract),Object.fromEntries(runtimeStrings.map(s=>[keyFor(s),s])));
const mode=process.argv[2];
if (!['--extract','--write','--check'].includes(mode)) throw new Error('Use --extract, --write or --check');
if (mode==='--extract') {
	mkdirSync(resolve(root,'i18n'),{recursive:true});
	writeFileSync(resolve(root,'i18n/en.json'),JSON.stringify(english,null,'\t')+'\n');
	console.log(`Extracted ${Object.keys(english).length} strings.`);
} else {
	const expectedEnglish=JSON.parse(readFileSync(resolve(root,'i18n/en.json'),'utf8'));
	if (JSON.stringify(english)!==JSON.stringify(expectedEnglish)) throw new Error('English source changed: extract and translate before publishing');
	let count=0;
	function emit(path,content) {
		const target=resolve(root,path);
		if (mode==='--write') {mkdirSync(dirname(target),{recursive:true});writeFileSync(target,content);}
		else if (!existsSync(target) || readFileSync(target,'utf8')!==content) throw new Error(`Generated content stale: ${path}`);
		count++;
	}
	for (const locale of locales) {
		const catalog=JSON.parse(readFileSync(resolve(root,`i18n/${locale.code}.json`),'utf8'));
		validateCatalog(english,catalog);
		if(locale.code!=='en' && Object.keys(english).every(k=>catalog[k]===english[k])) throw new Error(`Untranslated catalog: ${locale.code}`);
		const messages=Object.fromEntries(runtimeStrings.map(s=>[s,catalog[keyFor(s)]]));
		emit(`assets/i18n/${locale.code}.js`,`window.mechaMessages = ${JSON.stringify(messages).replaceAll('<','\\u003c')};\n`);
		for (const [page,source] of Object.entries(sources)) {
			let output=render(source,page,locale.code,catalog)
				.replace('/assets/i18n/en.js',`/assets/i18n/${locale.code}.js`);
			if (locale.code!=='en') {
				const policy=page.startsWith('legal/');
				const machineLabel=escapeAttribute(catalog[keyFor('Machine translation. Corrections are welcome.')]);
				const policyLink=policy?` <a href="/l/en/${page.replace(/index\.html$/,'')}">${escapeAttribute(catalog[keyFor('Translation of the English policy. Read the English original.')])}</a>`:'';
				const notice=`<aside class="translation-notice"><a href="${localizedPath('/contact/',locale.code)}">${machineLabel}</a>${policyLink}</aside>`;
				output=output.replace('<main>',`<main>\n${notice}`);
			}
			emit(`l/${locale.code}/${page}`,output);
		}
	}
	console.log(`${mode==='--write'?'Generated':'Verified'} ${count} localized artifacts.`);
}

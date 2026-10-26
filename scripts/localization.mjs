import {createHash} from 'node:crypto';
import {locales, localizedPath} from '../assets/js/locale.mjs';

export const pages = ['index.html','software/index.html','consulting/index.html','contact/index.html',
	'legal/terms/index.html','legal/privacy/index.html','legal/refund/index.html',
	'work/index.html','work/incitez/index.html','thoughts/index.html','thoughts/mfic/index.html'];
export const keyFor = value => 's_' + createHash('sha256').update(value).digest('hex').slice(0,16);
const inline = new Set(['a','abbr','b','bdi','br','button','code','em','i','small','span','strong','sup','u','wbr']);
const units = new Set(['title','p','h1','h2','h3','h4','h5','h6','li','dt','dd','th','td','figcaption','label','summary','a','span','button','div']);
const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const ignored = new Set(['script','style','svg','pre','code']);
export const escapeAttribute = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const textExists = value => /[\p{L}]/u.test(value.replace(/<[^>]*>|&[\w#]+;/g,''));
const markup = value => value.match(/<[^>]*>/g) ?? [];
// The source grammar is deliberately narrow: static, balanced HTML with quoted
// attributes. Unknown or unbalanced source fails extraction instead of drifting.
function tree(html) {
	const root = {tag:'root', children:[]};
	const stack = [root];
	for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>|[^<]+/g)) {
		const token=match[0], start=match.index;
		if (token.startsWith('<!')) continue;
		if (token.startsWith('</')) {
			const tag=token.match(/^<\/([\w-]+)/)[1].toLowerCase();
			const node=stack.pop();
			if (node?.tag !== tag) throw new Error(`Unbalanced HTML: ${tag}`);
			node.close=start; node.end=start+token.length;
		} else if (token.startsWith('<')) {
			const tag=token.match(/^<([\w-]+)/)[1].toLowerCase();
			const node={tag,start,open:start+token.length,close:start+token.length,end:start+token.length,children:[]};
			stack.at(-1).children.push(node);
			if (!voids.has(tag) && !token.endsWith('/>')) stack.push(node);
		} else stack.at(-1).children.push({tag:null,start,end:start+token.length});
	}
	if (stack.length !== 1) throw new Error('Unclosed HTML source');
	return root;
}
function ranges(html) {
	// Script/style contents may contain HTML-like strings; mask them at equal length.
	const masked=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, s => ' '.repeat(s.length));
	const found=[];
	const inlineOnly = node => node.children.every(c => !c.tag || (inline.has(c.tag) && inlineOnly(c)));
	function visit(node) {
		if (ignored.has(node.tag)) return;
		if (units.has(node.tag) && inlineOnly(node)) {
			const raw=html.slice(node.open,node.close), value=raw.trim();
			if (textExists(value)) found.push({start:node.open+raw.indexOf(value),end:node.open+raw.indexOf(value)+value.length,value});
			return;
		}
		for (const child of node.children ?? []) {
			if (child.tag) visit(child);
			else {
				const raw=masked.slice(child.start,child.end),value=raw.trim();
				if (textExists(value)) found.push({start:child.start+raw.indexOf(value),end:child.start+raw.indexOf(value)+value.length,value});
			}
		}
	}
	visit(tree(masked));
	return found;
}
function attributeRanges(html) {
	const result=[];
	for (const tag of html.matchAll(/<[A-Za-z][^>]*>/g)) {
		const isMeta = /^<meta\b/.test(tag[0]) && /(?:name|property)="(?:description|og:title|og:description|og:image:alt|twitter:image:alt)"/.test(tag[0]);
		for (const attr of tag[0].matchAll(/\b(alt|title|aria-label|data-enabled-label|content)="([^"]*)"/g)) {
			if (attr[1]==='content' && !isMeta) continue;
			if (textExists(attr[2])) result.push({value:attr[2], start:tag.index+attr.index+attr[1].length+2, end:tag.index+attr.index+attr[1].length+2+attr[2].length});
		}
	}
	return result;
}
export function extract(html) {
	return Object.fromEntries([...ranges(html),...attributeRanges(html)].map(({value}) => [keyFor(value),value]));
}
export function validateCatalog(source, catalog) {
	if (JSON.stringify(Object.keys(source).sort()) !== JSON.stringify(Object.keys(catalog).sort())) throw new Error('Catalog keys differ from English');
	for (const [key,value] of Object.entries(catalog)) {
		if (typeof value !== 'string' || !value.trim()) throw new Error(`Catalog empty: ${key}`);
		if (JSON.stringify(markup(value)) !== JSON.stringify(markup(source[key]))) throw new Error(`Catalog markup changed: ${key}`);
		if (/[<>]/.test(value.replace(/<[^>]*>/g,''))) throw new Error(`Catalog malformed markup: ${key}`);
		// Prices and numeric claims cannot be changed by translation. Localized
		// grouping/decimal conventions can be introduced as a separate formatter.
		const numbers = s => (s.replace(/<[^>]*>/g,' ').match(/\d+(?:[.,]\d+)*/g) ?? []).sort();
		if (JSON.stringify(numbers(value)) !== JSON.stringify(numbers(source[key]))) throw new Error(`Catalog numbers changed: ${key}`);
		const brands=s=>(s.replace(/<[^>]*>/g,' ').match(/\b(?:Mecha|BeamFlix|Validate|RotShield|Paddle|GSD|MFIC|incitez|eyecite)\b/g)??[]).sort();
		if (JSON.stringify(brands(value))!==JSON.stringify(brands(source[key]))) throw new Error(`Catalog brand changed: ${key}`);
	}
}
function replaceRanges(text, edits) {
	for (const edit of edits.sort((a,b) => b.start-a.start)) text=text.slice(0,edit.start)+edit.value+text.slice(edit.end);
	return text;
}
export function picker(path, selected, label='Language') {
	return `<div class="language-picker"><label for="site-language">${label}</label><select id="site-language" dir="ltr">${locales.map(l => `<option value="${l.code}" lang="${l.tag}"${l.code===selected?' selected':''}>${l.name}</option>`).join('')}</select><noscript><details><summary>${label}</summary>${locales.map(l=>`<a href="${localizedPath(path,l.code)}" lang="${l.tag}" dir="${l.dir}">${l.name}</a>`).join(' ')}</details></noscript></div>`;
}
export function render(html, page, code, catalog) {
	const locale=locales.find(l => l.code===code);
	if (!locale) throw new Error('Unsupported locale');
	const text = value => {
		const result=catalog[keyFor(value)];
		if (result===undefined) throw new Error(`Missing translation: ${value}`);
		return result;
	};
	const attrEdits=attributeRanges(html).map(r=>({...r,value:escapeAttribute(text(r.value).replaceAll('&amp;','&').replaceAll('&quot;','"'))}));
	// Translate attributes first, then find textual units using original offsets.
	// Outer phrase keys use original markup; nested attributes are translated in a
	// final pass rather than changing the lookup key prematurely.
	const phraseRanges=ranges(html);
	const edits=phraseRanges.map(r=>({...r,value:text(r.value)}));
	for (const attr of attrEdits) if (!phraseRanges.some(r=>attr.start>=r.start && attr.end<=r.end)) edits.push(attr);
	let result=replaceRanges(html,edits);
	// Attributes inside translated phrases were protected as markup. Translate
	// their values afterward, using only original catalog keys.
	result=replaceRanges(result,attributeRanges(result).filter(r=>catalog[keyFor(r.value)]!==undefined)
		.map(r=>({...r,value:escapeAttribute(text(r.value).replaceAll('&amp;','&').replaceAll('&quot;','"'))})));
	result=result.replace(/<html lang="en">/,`<html lang="${locale.tag}" dir="${locale.dir}">`);
	const path='/'+page.replace(/index\.html$/,'');
	result=result.replace(/href="(\/[^"#?]*\/?)([?#][^"]*)?"/g,(all,target,suffix='')=>{
		if (target.startsWith('/assets/') || !pages.some(p=>'/'+p.replace(/index\.html$/,'')===target)) return all;
		return `href="${localizedPath(target,code)}${suffix}"`;
	});
	result=result.replace(/(<meta property="og:url" content=")[^"]+("\s*\/?>)/,`$1https://mecha.llc${localizedPath(path,code)}$2`);
	const alternate=locales.map(l=>`  <link rel="alternate" hreflang="${l.tag}" href="https://mecha.llc${localizedPath(path,l.code)}">`).join('\n');
	result=result.replace('</head>',`  <link rel="canonical" href="https://mecha.llc${localizedPath(path,code)}">\n${alternate}\n  <link rel="alternate" hreflang="x-default" href="https://mecha.llc${path}">\n</head>`);
	const label=catalog[keyFor('Language')] ?? 'Language';
	result=result.replace('</nav>',`${picker(path,code,label)}\n</nav>`);
	return result;
}

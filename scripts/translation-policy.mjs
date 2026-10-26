import {locales} from '../assets/js/locale.mjs';

// Site-specific publication judgment from the reviewed catalogs, not a claim
// about every translator or every text in these languages. See docs/I18N.md.
const uncertainLocales=new Set(['am','ha','ig','ps','yo']);
export function translationNotice(code,page) {
	if(!locales.some(locale=>locale.code===code)) throw new Error('Unsupported locale');
	return {machine:uncertainLocales.has(code),englishPolicy:code!=='en' && page.startsWith('legal/')};
}

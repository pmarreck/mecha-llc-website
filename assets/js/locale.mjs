const definitions = [
	['am','አማርኛ'],['ar','العربية'],['az','Azərbaycanca'],['bg','Български'],['bn','বাংলা'],
	['bs','Bosanski'],['da','Dansk'],['de','Deutsch'],['el','Ελληνικά'],['en','English'],
	['es','Español'],['fa','فارسی'],['fi','Suomi'],['fil','Filipino'],['fr','Français'],
	['ha','Hausa'],['he','עברית'],['hi','हिन्दी'],['hr','Hrvatski'],['hu','Magyar'],
	['id','Bahasa Indonesia'],['ig','Igbo'],['is','Íslenska'],['it','Italiano'],['ja','日本語'],
	['km','ខ្មែរ'],['ko','한국어'],['mk','Македонски'],['nb','Norsk bokmål'],['nl','Nederlands'],
	['pa','ਪੰਜਾਬੀ'],['pl','Polski'],['ps','پښتو'],['pt_br','Português (Brasil)'],['ro','Română'],
	['ru','Русский'],['sl','Slovenščina'],['sq','Shqip'],['sr','Српски'],['sv','Svenska'],
	['sw','Kiswahili'],['ta','தமிழ்'],['th','ไทย'],['tr','Türkçe'],['uk','Українська'],
	['ur','اردو'],['vi','Tiếng Việt'],['yo','Yorùbá'],['zh_hans','简体中文'],['zh_hant','繁體中文'],
];
export const locales = definitions.map(([code, name]) => ({code, name,
	tag: ({pt_br:'pt-BR',zh_hans:'zh-Hans',zh_hant:'zh-Hant'})[code] ?? code,
	dir: ['ar','fa','he','ps','ur'].includes(code) ? 'rtl' : 'ltr'}));
export function normalizeLocale(value) {
	if (typeof value !== 'string') return null;
	const normalized = value.trim().toLowerCase().replaceAll('_','-');
	const parts = normalized.split('-');
	if (parts[0] === 'zh') {
		if (parts.includes('hant')) return 'zh_hant';
		if (parts.includes('hans')) return 'zh_hans';
		return parts.some(p => ['tw','hk','mo'].includes(p)) ? 'zh_hant' : 'zh_hans';
	}
	const base = ({pt:'pt_br',iw:'he',no:'nb'})[parts[0]] ?? parts[0];
	return locales.some(l => l.code === base) ? base : null;
}
export function chooseLocale({explicit, saved, languages = []} = {}) {
	return normalizeLocale(explicit) ?? normalizeLocale(saved)
		?? languages.map(normalizeLocale).find(Boolean) ?? 'en';
}
export function splitLocalePath(path) {
	const match = path.match(/^\/l\/([^/]+)(\/.*|$)/);
	if (match && locales.some(l => l.code === match[1])) return {locale:match[1],path:match[2] || '/'};
	return {locale:null,path};
}
export function localizedPath(path, locale) {
	if (!locales.some(l => l.code === locale)) throw new Error('Unsupported locale');
	return `/l/${locale}${splitLocalePath(path).path}`;
}

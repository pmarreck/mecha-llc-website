import {locales,chooseLocale,splitLocalePath,localizedPath} from './locale.mjs';
import './tooltips.mjs';

export function initializeLanguage(documentObject,windowObject) {
	const location=windowObject.location;
	const current=splitLocalePath(location.pathname);
	let saved;
	try {saved=windowObject.localStorage.getItem('mecha-language');} catch { /* Privacy mode may deny storage. */ }
	const selected=chooseLocale({explicit:current.locale,saved,
		languages:windowObject.navigator.languages?.length ? windowObject.navigator.languages : [windowObject.navigator.language]});
	if (!current.locale && selected!=='en') {
		location.replace(localizedPath(location.pathname+location.search+location.hash,selected));
		return {redirected:true,locale:selected};
	}
	let select=documentObject.getElementById('site-language');
	if (!select) {
		const nav=documentObject.querySelector('.site-nav');
		if (!nav) return {redirected:false,locale:selected};
		const container=documentObject.createElement('div');container.className='language-picker';
		const label=documentObject.createElement('label');label.htmlFor='site-language';
		label.textContent=windowObject.mechaMessages?.Language ?? 'Language';
		select=documentObject.createElement('select');select.id='site-language';select.dir='ltr';
		for(const locale of locales){const option=documentObject.createElement('option');
			option.value=locale.code;option.lang=locale.tag;option.textContent=locale.name;select.append(option);}
		container.append(label,select);nav.append(container);
	}
	select.value=selected;
	select.addEventListener('change',()=>{
		if(!locales.some(l=>l.code===select.value)) return;
		try {windowObject.localStorage.setItem('mecha-language',select.value);} catch { /* URL still carries the choice. */ }
		location.assign(localizedPath(location.pathname+location.search+location.hash,select.value));
	});
	return {redirected:false,locale:selected};
}

if(typeof document!=='undefined' && typeof window!=='undefined') {
	initializeLanguage(document,window);
}

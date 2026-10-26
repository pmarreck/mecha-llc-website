export function initializeTooltips(documentObject) {
	for (const trigger of documentObject.querySelectorAll('.term-trigger')) {
		const anchor=trigger.parentElement;
		trigger.addEventListener('click',()=>{
			anchor.classList.remove('tooltip-dismissed');anchor.classList.toggle('tooltip-open');
		});
		trigger.addEventListener('keydown',event=>{
			if(event.key==='Escape'){anchor.classList.remove('tooltip-open');anchor.classList.add('tooltip-dismissed');}
		});
		anchor.addEventListener('mouseleave',()=>anchor.classList.remove('tooltip-dismissed','tooltip-open'));
		trigger.addEventListener('blur',()=>anchor.classList.remove('tooltip-dismissed','tooltip-open'));
	}
}
if(typeof document!=='undefined') initializeTooltips(document);

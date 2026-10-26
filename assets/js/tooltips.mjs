export function tooltipOffset(left,width,viewportWidth,margin=8) {
	return Math.min(Math.max(margin,viewportWidth-margin-width),Math.max(margin,left))-left;
}
export function initializeTooltips(documentObject,windowObject) {
	for (const trigger of documentObject.querySelectorAll('.term-trigger')) {
		const anchor=trigger.parentElement;
		const tooltip=anchor.querySelector('.term-tooltip');
		const position=()=>{
			tooltip.style.transform='';
			const {left,width}=tooltip.getBoundingClientRect();
			tooltip.style.transform=`translateX(${tooltipOffset(left,width,windowObject.innerWidth)}px)`;
		};
		anchor.addEventListener('mouseenter',position);
		trigger.addEventListener('focus',position);
		windowObject.addEventListener('resize',position);
		trigger.addEventListener('click',()=>{
			position();
			anchor.classList.remove('tooltip-dismissed');anchor.classList.toggle('tooltip-open');
		});
		trigger.addEventListener('keydown',event=>{
			if(event.key==='Escape'){anchor.classList.remove('tooltip-open');anchor.classList.add('tooltip-dismissed');}
		});
		anchor.addEventListener('mouseleave',()=>anchor.classList.remove('tooltip-dismissed','tooltip-open'));
		trigger.addEventListener('blur',()=>anchor.classList.remove('tooltip-dismissed','tooltip-open'));
	}
}
if(typeof document!=='undefined') initializeTooltips(document,window);

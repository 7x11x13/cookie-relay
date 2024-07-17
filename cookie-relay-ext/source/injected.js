function init() {
	const variableName = document.currentScript.dataset.variableName;
	const eventName = document.currentScript.dataset.eventName;
	const value = window[variableName];
	document.dispatchEvent(new CustomEvent(eventName, {
		detail: value,
	}));
}

init();

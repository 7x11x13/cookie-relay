import * as browser from 'webextension-polyfill';

class ExtractPageVariable {
	_variableName: string;
	_handShake: string;
	_data: unknown;

	constructor(variableName: string) {
		this._variableName = variableName;
		this._handShake = this._generateHandshake();
		this._inject();
		this._data = this._listen();
	}

	get data() {
		return this._data;
	}

	_generateHandshake() {
		const array = new Uint32Array(8);
		return crypto.getRandomValues(array).toString();
	}

	_inject() {
		const script = document.createElement('script');
		script.src = browser.runtime.getURL('injected.js');
		script.dataset.variableName = this._variableName;
		script.dataset.eventName = this._handShake;
		(document.head || document.documentElement).append(script);
		script.addEventListener('load', () => {
			script.remove();
		});
	}

	async _listen() {
		return new Promise(resolve => {
			document.addEventListener(
				this._handShake,
				((event: CustomEvent<unknown>) => {
					resolve(event.detail);
				}) as EventListener,
				false,
			);
		});
	}
}

export async function getPageVariable(variableName: string) {
	return new ExtractPageVariable(variableName).data;
}

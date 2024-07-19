import browser from 'webextension-polyfill';

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
		const array = new Uint32Array(5);
		return window.crypto.getRandomValues(array).toString();
	}

	_inject() {
		function propagateVariable(handShake: string, variableName: string) {
			const message: Record<string, unknown> = {
				handShake,
			};
			message[variableName] = window[variableName as keyof typeof window] as unknown;
			window.postMessage(message, '*');
		}

		const script = `( ${propagateVariable.toString()} )('${
			this._handShake
		}', '${this._variableName}');`;
		const scriptTag = document.createElement('script');
		const scriptBody = document.createTextNode(script);

		scriptTag.id = 'chromeExtensionDataPropagator';
		scriptTag.append(scriptBody);
		document.body.append(scriptTag);
	}

	async _listen() {
		return new Promise(resolve => {
			window.addEventListener(
				'message',
				({data}) => {
					// We only accept messages from ourselves
					if (data.handShake !== this._handShake) {
						return;
					}

					resolve(data[this._variableName]);
				},
				false,
			);
		});
	}
}

export async function getPageVariable(variableName: string) {
	const isFirefox = browser.runtime.getURL('').startsWith('moz-extension://');
	console.debug('isFirefox:', isFirefox);
	if (isFirefox) {
		// Firefox
		return new ExtractPageVariable(variableName).data;
	}

	// Chrome - supports "world": "MAIN" content script
	return window[variableName as keyof typeof window] as unknown;
}

function init() {
	const variableName = document.currentScript.dataset.variableName;
	const eventName = document.currentScript.dataset.eventName;
	const isYTsessionToken = (variableName === 'yt-session-token');

	if (isYTsessionToken) {
		const send = XMLHttpRequest.prototype.send;
		XMLHttpRequest.prototype.send = function (data) {
			this.addEventListener('load', event => {
				if (event.target.responseURL.startsWith('https://studio.youtube.com/youtubei/v1/ars/grst')) {
					const token = JSON.parse(event.target.response).sessionToken;
					document.dispatchEvent(new CustomEvent(eventName, {
						detail: token,
					}));
				}
			});

			send.call(this, data);
		};
	}

	if (!isYTsessionToken) {
		const value = window[variableName];
		document.dispatchEvent(new CustomEvent(eventName, {
			detail: value,
		}));
	}
}

init();

const form: HTMLFormElement = document.querySelector('#form')!;
const urlInput: HTMLInputElement = document.querySelector('#api-url')!;
const keyInput: HTMLInputElement = document.querySelector('#api-key')!;

async function onFormSave(event: Event) {
	event.preventDefault();
	const formData = new FormData(form);
	const cookieRelayApiUrl = formData.get('api-url');
	const cookieRelayApiKey = formData.get('api-key');
	await browser.storage.local.set({cookieRelayApiUrl, cookieRelayApiKey});
}

form.addEventListener('submit', onFormSave);

async function getApiUrl() {
	let {cookieRelayApiUrl}
		= await browser.storage.local.get('cookieRelayApiUrl');
	cookieRelayApiUrl ||= 'http://localhost:1001';

	return cookieRelayApiUrl as string;
}

async function getApiKey() {
	const {cookieRelayApiKey}
		= await browser.storage.local.get('cookieRelayApiKey');
	return cookieRelayApiKey as string;
}

window.addEventListener('load', async event => {
	urlInput.value = await getApiUrl();
	keyInput.value = await getApiKey();
});

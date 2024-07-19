import browser from 'webextension-polyfill';
import {websites} from './const';
import {type WebsiteIdMessage} from './types';
import {type CookieWebsite} from './websites';

type Cookie = browser.Cookies.Cookie;

const currentCookies: Record<string, Cookie[]> = {}; // "website:userId -> cookies[]"
const currentUserId: Record<string, string> = {}; // "website -> userId"

async function onMessage(message: WebsiteIdMessage) {
	console.debug(message);
	const {website, userId} = message;
	currentUserId[website] = userId;
}

async function sendCookies(
	apiUrl: string,
	apiKey: string,
	website: string,
	userId: string,
	cookies: Cookie[],
) {
	const url = new URL(`/cookies/${website}/${userId}`, apiUrl);
	await fetch(url, {
		method: 'POST',
		headers: {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'Cookie-Relay-API-Key': apiKey,
		},
		body: JSON.stringify(cookies),
	});
}

function changedCookies(
	cookies: Cookie[],
	website: CookieWebsite,
	userId: string,
): Cookie[] {
	if (userId === undefined) {
		return [];
	}

	const id = `${website.name}:${userId}`;

	if (!(id in currentCookies)) {
		currentCookies[id] = cookies;
		return cookies;
	}

	const oldCookies = currentCookies[id];
	const changed: Cookie[] = [];
	for (const key of website.cookieWhitelist) {
		const oldCookie = oldCookies.find(({name, value, domain}) => name === key);
		const newCookie = cookies.find(({name, value, domain}) => name === key);
		if ((newCookie && oldCookie?.value !== newCookie.value)) {
			changed.push(newCookie);
		}
	}

	return changed;
}

async function getApiUrl() {
	let {cookieRelayApiUrl} = await browser.storage.local.get('cookieRelayApiUrl') as {cookieRelayApiUrl: string};
	cookieRelayApiUrl ||= 'http://localhost:1001';

	return cookieRelayApiUrl;
}

async function getApiKey() {
	let {cookieRelayApiKey} = await browser.storage.local.get('cookieRelayAPIKey') as {cookieRelayApiKey: string};
	cookieRelayApiKey ||= 'apikey';

	return cookieRelayApiKey;
}

async function sendCookiesIfChanged() {
	// Get current cookies for all websites
	const cookies = await Promise.all(
		websites.map(async (website: CookieWebsite) => ({
			service: website,
			cookies: await website.getCurrentCookies(),
		})),
	);
	console.debug(cookies);
	// Only send cookies which have been updated since last send
	const changed = cookies
		.map(({service, cookies}) => ({
			service,
			cookies: changedCookies(cookies, service, currentUserId[service.name]),
		}))
		.filter(({service, cookies}) => cookies.length);
	console.debug(changed);
	if (changed.length === 0) {
		return;
	}

	const apiUrl = await getApiUrl();
	const apiKey = await getApiKey();
	await Promise.all(changed.map(async ({service, cookies}) => sendCookies(
		apiUrl,
		apiKey,
		service.name,
		currentUserId[service.name],
		cookies,
	)));
}

browser.runtime.onMessage.addListener(onMessage);
browser.cookies.onChanged.addListener(sendCookiesIfChanged);
void sendCookiesIfChanged();

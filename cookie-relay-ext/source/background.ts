import * as browser from 'webextension-polyfill';
import {websites} from './const';
import {type WebsiteMessage, type WebsiteIdMessage, type WebsiteCookieMessage} from './types';
import {type CookieWebsite} from './websites';

type Cookie = browser.Cookies.Cookie;

const currentCookies: Record<string, Cookie[]> = {}; // "website:userId -> cookies[]"
const extraCookies: Record<string, Cookie[]> = {}; // "website:userId -> cookies[]"
const currentUserId: Record<string, string> = {}; // "website -> userId"

async function onMessage(message: WebsiteMessage) {
	console.debug('MESSAGE:', message);
	if (message.type === 'id') {
		const {website, userId} = message as WebsiteIdMessage;
		currentUserId[website] = userId;
	} else if (message.type === 'cookie') {
		let {website, cookies, userId} = message as WebsiteCookieMessage;
		const service = websites.find(cw => cw.name === website)!;

		userId ||= currentUserId[website];

		if (!userId) {
			return;
		}

		const id = `${website}:${userId}`;
		extraCookies[id] = cookies;

		await sendNewCookies([{service, cookies: currentCookies[id] || []}]);
	}
}

async function sendCookies(
	apiUrl: string,
	apiKey: string,
	website: string,
	userId: string,
	cookies: Cookie[],
) {
	const id = `${website}:${userId}`;
	if (id in extraCookies) {
		cookies = cookies.concat(extraCookies[id]);
	}

	const url = new URL(`/cookies/${website}/${userId}`, apiUrl);
	const result = await fetch(url, {
		method: 'POST',
		headers: {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'Cookie-Relay-API-Key': apiKey,
		},
		body: JSON.stringify(cookies),
	});
	if (result.status === 200) {
		currentCookies[id] = cookies;
	} else {
		console.error(result);
	}
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
		return cookies;
	}

	const oldCookies = currentCookies[id];
	for (const key of website.cookieWhitelist) {
		const oldCookie = oldCookies.find(({name, value, domain}) => name === key);
		const newCookie = cookies.find(({name, value, domain}) => name === key);
		if ((newCookie && oldCookie?.value !== newCookie.value)) {
			// Cookies have changed, return them
			return cookies;
		}
	}

	return [];
}

async function getApiUrl() {
	let {cookieRelayApiUrl} = await browser.storage.local.get('cookieRelayApiUrl') as {cookieRelayApiUrl: string};
	cookieRelayApiUrl ||= 'http://localhost:1001';

	return cookieRelayApiUrl;
}

async function getApiKey() {
	let {cookieRelayApiKey} = await browser.storage.local.get('cookieRelayApiKey') as {cookieRelayApiKey: string};
	cookieRelayApiKey ||= 'apikey';

	return cookieRelayApiKey;
}

async function sendNewCookies(newCookies: Array<{
	service: CookieWebsite;
	cookies: browser.Cookies.Cookie[];
}>) {
	const apiUrl = await getApiUrl();
	const apiKey = await getApiKey();
	await Promise.all(newCookies.map(async ({service, cookies}) => sendCookies(
		apiUrl,
		apiKey,
		service.name,
		currentUserId[service.name],
		cookies,
	)));
}

async function sendCookiesIfChanged() {
	// Get current cookies for all websites
	const cookies = await Promise.all(
		websites.map(async (website: CookieWebsite) => ({
			service: website,
			cookies: await website.getCurrentCookies(),
		})),
	);
	console.debug(cookies, currentUserId);
	// Only send cookies which have been updated since last send
	const changed = cookies
		.map(({service, cookies}) => ({
			service,
			cookies: changedCookies(cookies, service, currentUserId[service.name]),
		}))
		.filter(({service, cookies}) => cookies.length);
	console.debug(changed);
	await sendNewCookies(changed);
}

browser.runtime.onMessage.addListener(onMessage);
browser.cookies.onChanged.addListener(sendCookiesIfChanged);

void sendCookiesIfChanged();

import * as browser from 'webextension-polyfill';
import {websites} from './const';
import {type WebsiteCookieMessage, type WebsiteIdMessage, type Cookie} from './types';
import {getPageVariable} from './utils';

async function init() {
	// Tell background script which site we are on
	// and what user ID we are logged in as
	const url = window.location.href;
	for (const website of websites) {
		if (website.isWebsiteUrl(url)) {
			const name = website.name;
			// eslint-disable-next-line no-await-in-loop
			const userId = await website.extractId();
			console.debug(`USERID: ${userId}`);
			if (userId) {
				const message: WebsiteIdMessage = {type: 'id', website: name, userId};
				// eslint-disable-next-line no-await-in-loop
				await browser.runtime.sendMessage(message);
			}

			return;
		}
	}

	// If on youtube studio page, grab session token
	const ytStudioRegex = /^https:\/\/studio\.youtube\.com\/channel\/([^/]+)\/.*$/;
	if (ytStudioRegex.test(url)) {
		const token = await getPageVariable('yt-session-token') as string;
		const cookie: Cookie = {
			name: 'SESSION_TOKEN',
			value: token,
			domain: '.youtube.com',
			hostOnly: false,
			path: '/',
			secure: true,
			httpOnly: true,
			sameSite: 'no_restriction',
			session: true,
			storeId: '',
			firstPartyDomain: '',
		};
		const userId = ytStudioRegex.exec(url)![1];
		await browser.runtime.sendMessage({type: 'id', website: 'youtube', userId});
		const message: WebsiteCookieMessage = {
			type: 'cookie', website: 'youtube', cookies: [cookie], userId,
		};
		await browser.runtime.sendMessage(message);
	}
}

void init();

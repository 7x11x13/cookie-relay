import browser from 'webextension-polyfill';
import {websites} from './const';
import {type WebsiteIdMessage} from './types';

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
				const message: WebsiteIdMessage = {website: name, userId};
				// eslint-disable-next-line no-await-in-loop
				await browser.runtime.sendMessage(message);
			}

			return;
		}
	}
}

void init();

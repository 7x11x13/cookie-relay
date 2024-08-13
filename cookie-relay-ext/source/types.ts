import type * as browser from 'webextension-polyfill';

export type WebsiteMessage = {
	type: 'id' | 'cookie';
	website: string;
};

export type WebsiteIdMessage = {
	type: 'id';
	userId: string;
} & WebsiteMessage;

export type Cookie = browser.Cookies.Cookie;

export type WebsiteCookieMessage = {
	type: 'cookie';
	cookies: Cookie[];
} & WebsiteMessage;

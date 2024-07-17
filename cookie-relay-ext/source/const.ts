import {getPageVariable} from './utils';
import {CookieWebsite} from './websites';

function _htmlDecode(input: string): string {
	const document_ = new DOMParser().parseFromString(input, 'text/html');
	return document_.documentElement.textContent ?? '';
}

export const websites = [
	new CookieWebsite(
		'youtube',
		'https://youtube.com',
		[
			'LOGIN_INFO',
			'__Secure-1PSID',
			'__Secure-3PSID',
			'__Secure-1PAPISID',
			'__Secure-3PAPISID',
			'__Secure-1PSIDTS',
			'__Secure-3PSIDTS',
			'SAPISID',
		],
		/^https:\/\/www\.youtube\.com.*$/,
		async () => {
			const ytInitialData = await getPageVariable('ytInitialData');
			return (ytInitialData as any).topbar.desktopTopbarRenderer.topbarButtons[0]
				.topbarMenuButtonRenderer.menuRenderer.multiPageMenuRenderer.sections[0]
				.multiPageMenuSectionRenderer.items[2].compactLinkRenderer
				.navigationEndpoint.browseEndpoint.browseId as string | undefined;
		},
	),
	new CookieWebsite(
		'soundcloud',
		'https://soundcloud.com',
		['oauth_token'],
		/^https:\/\/soundcloud\.com.*$/,
		async () => {
			const scHydration: any = await getPageVariable('__sc_hydration');
			const userId = scHydration[1].data.id as number | undefined;
			if (userId === undefined) {
				return userId;
			}

			return `${userId}`;
		},
	),
	new CookieWebsite(
		'bandcamp',
		'https://bandcamp.com',
		['identity'],
		/^https:\/\/([^.]+\.)?bandcamp\.com.*$/,
		async () => {
			const data: HTMLDivElement = document.querySelector('#pagedata')!;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const json = JSON.parse(
				_htmlDecode(data.dataset.blob!),
			);
			return `${json.identities.user.id}`;
		},
	),
];

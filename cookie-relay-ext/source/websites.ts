export class CookieWebsite {
	_name: string;
	_cookieUrl: string;
	_cookieWhitelist: string[];
	_urlRegex: RegExp;
	_idExtractor: () => Promise<string | undefined>;

	constructor(
		name: string,
		cookieUrl: string,
		cookieInclude: string[],
		urlRegex: RegExp,
		idExtractor: () => Promise<string | undefined>,
	) {
		this._name = name;
		this._cookieUrl = cookieUrl;
		this._cookieWhitelist = cookieInclude;
		this._urlRegex = urlRegex;
		this._idExtractor = idExtractor;
	}

	get name() {
		return this._name;
	}

	get cookieUrl() {
		return this._cookieUrl;
	}

	get cookieWhitelist() {
		return this._cookieWhitelist;
	}

	isWebsiteUrl(url: string) {
		return this._urlRegex.test(url);
	}

	async extractId() {
		try {
			return await this._idExtractor();
		} catch (error) {
			console.error(error);
			return undefined;
		}
	}

	async getCurrentCookies() {
		const cookies = await browser.cookies.getAll({
			url: this.cookieUrl,
		});
		return cookies.filter(({name, value, domain}) => this.cookieWhitelist.includes(name));
	}
}

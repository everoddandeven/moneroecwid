

export abstract class EcwidApp {
    private static _appId: any;
    private static _lastHeight: any;
    private static _payload: any;
    private static _initialized: boolean;


    //#region Private Methods 

	private static postMessage(method: string, data: any): void {
		this.checkInitialized();
		window.parent.postMessage(JSON.stringify({
			ecwidAppNs: this._appId,
			method: method,
			data: data
		}), "*");
	}

	private static isObject(arg: any): boolean {
		return arg !== null && typeof arg == 'object';
	}

	private static isString(arg: any): boolean {
		return typeof arg == 'string';
	}

	private static isInteger(arg: any): boolean {
		return arg === parseInt(arg);
	}

	private static isFunction(arg: any): boolean {
		return typeof arg == 'function' || false;
	}

	private static checkCondition(condition: boolean, message: string): void {
		if (!condition) {
			throw Error(message || '');
		}
	}

	private static isInitialized(): boolean {
		return this._initialized == true;
	}

	private static checkInitialized(): void {
		this.checkCondition(this.isInitialized(), "Not initialized");
	}

	private static checkNotInitialized(): void {
		this.checkCondition(!this.isInitialized(), "Already initialized");
	}

	private static getPayloadFromHash(): any | null {
        var hashvalue = window.location.hash;
		if( hashvalue == 'undefined' || hashvalue.length <= 1) {
			if (typeof window.console != 'undefined') {
				window.console.log("Wrong hash value:"+hashvalue);
				return null;
			}
		}

        let encodedPayload;

        // #! - Default hashPrefix in Angular
        if (hashvalue.startsWith('#!')) {
            const lastHashIndex = hashvalue.lastIndexOf('#');
            encodedPayload = hashvalue.substring(lastHashIndex + 1); // Exclude hashbang with # from the string for Angular
        } else {
            encodedPayload = hashvalue.substring(1); // Exclude # from the string
        }
		return this.decodePayload(encodedPayload);
	}

	private static getPayloadFromParam(): any | null {
		const query = window.location.search.substring(1);
		const vars = query.split('&');
		for (var i = 0; i < vars.length; i++) {
            const v = vars[i];

            if (!v) continue;

			const pair = v.split('=');
            const first = pair[0];
            const second = pair[1];
			if (first && second && (decodeURIComponent(first) === 'devpayload' || decodeURIComponent(first) === 'payload')) {
				return this.decodePayload(decodeURIComponent(second));
			}
		}

		return null;
	}

	private static decodePayload(encodedPayload: any): any | null {
		let payloadStr, decodedPayload = null;

		try {
			payloadStr = this.hex2str(encodedPayload);
			decodedPayload = JSON.parse(payloadStr);
		} catch (e) {
			if (typeof(window.console) != 'undefined') {
				window.console.log("Error when parsing json :"+payloadStr+" , retrieved from hex value:"+encodedPayload+" "+e);
			}
		}

		return decodedPayload;
	}

    private static hex2str(hexx: any): string {
        const hex = hexx.toString();
        let str = '';
        for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }

	private static ajax(url: string, token: string, callback: (e: any) => void, method: string, data?: Document | XMLHttpRequestBodyInit, contentType = 'text/plain; charset=utf-8') {
		var x = new XMLHttpRequest();
		x.open(method, url, true);
		x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		x.setRequestHeader('Content-type', contentType);
		x.setRequestHeader('Authorization', 'Bearer ' + token);
		x.onreadystatechange = callback;
		x.send(data);
	}

    //#endregion

    //#region Public Methods

	public static init(params: any): void {
		this.checkNotInitialized()
		this.checkCondition(this.isObject(params), "The argument is not an object")
		
        if (params.this._appId != null) {
			this.checkCondition(this.isString(params.this._appId), "'this._appId' param must be string")
		}

        this._payload = this.getPayloadFromHash() || this.getPayloadFromParam();
		this._appId = params.this._appId;
		this._initialized = true;

		if (!!params.autoloadedflag) {
			window.addEventListener("load", (e) => {
				this.ready();
			});
		}

		if (!!params.autoheight) {
			window.setInterval(() => {
				var height;

				if (/MSIE (6|7|8|9|10).+Win/.test(navigator.userAgent)) {
					// IE shit
					height = Math.max(
						Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
						Math.max(document.body.offsetHeight, document.documentElement.offsetHeight),
						Math.max(document.body.clientHeight, document.documentElement.clientHeight)
					);
				} else {
					// Normal browser
					height = document.documentElement.offsetHeight
				}

				if (this._lastHeight != height) {
					this._lastHeight = height
					this.setSize({height: height})
				}
			}, 333)
		}
	}

	public static getAppClientId(): any {
		return this._appId;
	}

	public static ready(): void {
		this.checkInitialized();
		this.postMessage("ready", {});
	}

	public static setSize(params: any): void {
		this.checkInitialized();
		this.checkCondition(this.isObject(params), "The argument is not an object");

		let height: string;
		if (this.isInteger(params.height)) {
			height = params.height+"px"
		} else if (this.isString(params.height)) {
			height = params.height
		} else {
			throw Error("Missing or invalid 'height' param")
		}

		this.postMessage("setSize", {height: height})
	}

	public static getPayload(): any {
		return this._payload;
	}

	public static openPage(page: string): void {
		postMessage("openPage", page)
	}

	public static closeAppPopup(): void {
		postMessage("closeAppPopup")
	}

	public static getAppStorage(...args: any[]): void {
		var callback: (arg: any) => void;

		if (arguments.length === 0) {
			throw Error('No arguments passed');
		}

		function processResponse(text: string | null, key: boolean = false): void {
			if (text == null) {
				callback(text);
                return;
			}
			if (key) {
				callback(JSON.parse(text).value);
			} else {
				callback(JSON.parse(text));
			}

		}

		// Try to retrieve value by key
		if (this.isString(arguments[0])) {
			if (arguments.length > 1 && this.isFunction(arguments[1])) {
				callback = arguments[1];
			} else {
				throw Error('No success callback specified');
			}

			var errorHandler = arguments.length > 2 && this.isFunction(arguments[2])
				? arguments[2]
				: null;

            this.ajax(
                this.getApiDomain() + this._payload.store_id + '/storage/' + arguments[0],
                this._payload.access_token,
                (e) => {
                    if (e.target.readyState > 3) {
                        if (e.target.status == 200) {
                            processResponse(e.target.responseText, true);
                        } else if (e.target.status == 404) {
                            processResponse(null, true);
                        } else if (errorHandler) {
							errorHandler(e.target);
                        }
                    }
                },
                'GET'
            );
		} else {
			if (this.isFunction(arguments[0])) {
				callback = arguments[0];
			} else {
				throw Error('No success callback specified');
			}
			this.ajax(
                this.getApiDomain() + this._payload.store_id + '/storage',
                this._payload.access_token,
                (e) => {
                    if (e.target.readyState > 3 && e.target.status == 200) {
                        processResponse(e.target.responseText);
                    } else if (arguments.length > 1 && this.isFunction(arguments[1])) {
                        arguments[1](e.target);
                    }
                },
                'GET'
            );

		}
	}

	public static setAppStorage(kv: any, callback: (e: any) => void, errorCallback: (e: any) => void): void {
		for (var k in kv) {
			if (kv.hasOwnProperty(k)) {
				if (this.isString(k) && this.isString(kv[k])) {
					this.ajax(
                        this.getApiDomain() + this._payload.store_id + '/storage/' + k,
                        this._payload.access_token,
                        (e) => {
                            if (e.target.readyState > 3) {
                                if (e.target.status == 200) {
                                    if (this.isFunction(callback)) {
                                        callback(e.target);
                                    }
                                } else {
                                    if (this.isFunction(errorCallback)) {
                                        errorCallback(e.target);
                                    }
                                }
                            }
                        },
                        'POST',
                        kv[k]);
				}
			}
		}
	}

    public static setAppPublicConfig(config: any, callback: (e: any) => void, errorCallback: (e: any) => void): void {
        this.ajax(
            this.getApiDomain() + this._payload.store_id + '/storage/public',
            this._payload.access_token,
            (e) => {
                if (e.target.readyState > 3) {
                    if (e.target.status == 200) {
                        if (this.isFunction(callback)) {
                            callback(e.target);
                        }
                    } else {
                        if (this.isFunction(errorCallback)) {
                            errorCallback(e.target);
                        }
                    }
                }
            },
            'POST',
            config
        );
    }

    public static getAppPublicConfig(callback: (e: any) => void): void {
        this.getAppStorage('public', callback);
	}

	public static sendUserToUpgrade(features: any[], plan: any, period: any, displayPlanList: boolean = false): void {
		if (features != null) {
			this.checkCondition(Array.isArray(features), "EcwidApp.sendUserToUpgrade() failed: please pass features array as a parameter");
			this.checkCondition((features.length > 0 || !!plan), "EcwidApp.sendUserToUpgrade() failed: please pass feature flag as a parameter");
		}
		this.postMessage("upgradePlan", {features : features, plan: plan, period: period, displayPlanList: displayPlanList});
	}

	public static getApiDomain(): string {
		return 'https://app.ecwid.com/api/v3/';
	}

    //#endregion

}

declare global {
    interface Window {
        EcwidApp: EcwidApp;
    }
}



class HttpInterceptor {
    constructor() {
        this.events = [];
        this.setupXHRInterceptor();
        this.setupFetchInterceptor();
    }

    setupXHRInterceptor() {
        const originalXHR = window.XMLHttpRequest;
        const self = this;

        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const start = Date.now();

            xhr.addEventListener('load', function() {
                self.events.push({
                    type: 'xhr',
                    url: this.responseURL,
                    method: this._method,
                    request: this._data,
                    response: this.responseText,
                    status: this.status,
                    timestamp: start,
                    duration: Date.now() - start
                });
            });

            const originalOpen = xhr.open;
            xhr.open = function(method) {
                this._method = method;
                originalOpen.apply(this, arguments);
            };

            const originalSend = xhr.send;
            xhr.send = function(data) {
                this._data = data;
                originalSend.apply(this, arguments);
            };

            return xhr;
        };
    }

    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = function() {
            const start = Date.now();
            return originalFetch.apply(this, arguments)
                .then(async response => {
                    const clone = response.clone();
                    const responseData = await clone.text();

                    self.events.push({
                        type: 'fetch',
                        url: response.url,
                        method: arguments[0].method || 'GET',
                        request: arguments[0].body,
                        response: responseData,
                        status: response.status,
                        timestamp: start,
                        duration: Date.now() - start
                    });

                    return response;
                });
        };
    }
} 
class HttpInterceptor {
    constructor(recorder) {
        this.recorder = recorder;
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

        window.fetch = async (...args) => {
            const start = Date.now();
            alert("start fetch " + start.toLocaleString())
            const response = await originalFetch(...args);
            this.recorder.recordHttpEvent({
                type: 'fetch',
                method: args[0].method || 'GET',
                url: args[0].url || args[0],
                status: response.status
            });
            const clone = response.clone();
            const responseData = await clone.text();

            var event = {
                type: 'fetch',
                url: response.url,
                method: args[0].method || 'GET',
                request: args[0].body,
                response: responseData,
                status: response.status,
                timestamp: start,
                duration: Date.now() - start
            }

            alert("end fetch event = \n" + JSON.stringify(event))
            self.events.push(event);

            return response;
        };
    }

    start() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            this.recorder.recordHttpEvent({
                type: 'fetch',
                method: args[0].method || 'GET',
                url: args[0].url || args[0],
                status: response.status
            });
            return response;
        };
    }

    stop() {
        // Restore original fetch if needed
    }

    
} 
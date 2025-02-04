class UIRecorder {
    constructor() {
        this.recording = false;
        this.isPlaying = false;
        this.events = [];
        this.httpEvents = [];
        this.elementFinder = new ElementFinder();
        this.httpInterceptor = new HttpInterceptor(this);
        this.editableElements = new Map();
        this.scanElements();
    }

    scanElements() {
        // 扫描所有可编辑元素
        const inputs = document.getElementsByTagName('input');
        const textareas = document.getElementsByTagName('textarea');
        const selects = document.getElementsByTagName('select');
        
        const generateId = () => '_' + Math.random().toString(36).substr(2, 9);
        
        const processElement = (element) => {
            if (!element.id) {
                element.id = generateId();
            }
            this.editableElements.set(element.id, element);
            return element.id;
        };

        [...inputs, ...textareas, ...selects].forEach(processElement);
    }

    start() {
        this.recording = true;
        this.httpInterceptor.start();
        this.setupEventListeners();
    }

    stop() {
        this.recording = false;
        this.httpInterceptor.stop();
        this.removeEventListeners();
    }

    setupEventListeners() {
        // 原有的事件监听
        document.addEventListener('click', this.handleEvent.bind(this));
        document.addEventListener('touchstart', this.handleEvent.bind(this));
        document.addEventListener('touchend', this.handleEvent.bind(this));
        
        // 输入事件监听
        document.addEventListener('input', this.handleInputEvent.bind(this));
        document.addEventListener('change', this.handleChangeEvent.bind(this));
        document.addEventListener('propertychange', this.handleInputEvent.bind(this));
        
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyEvent.bind(this));
        document.addEventListener('keyup', this.handleKeyEvent.bind(this));
        
        // 滚动事件
        document.addEventListener('scroll', this.handleScrollEvent.bind(this), true);
    }

    handleEvent(event) {
        if (!this.recording || this.isPlaying) return;

        const target = event.target;
        const properties = this.elementFinder.getElementProperties(target);
        const xpath = this.elementFinder.getXPath(target);
        
        const eventData = {
            type: event.type,
            timestamp: Date.now(),
            target: properties,
            xpath: xpath,
            coordinates: {
                x: event.clientX || event.touches?.[0]?.clientX,
                y: event.clientY || event.touches?.[0]?.clientY
            },
            quadrant: this.determineQuadrant(event)
        };

        if (event.type === 'change') {
            eventData.value = target.value;
            if (target.tagName === 'SELECT') {
                eventData.selectedIndex = target.selectedIndex;
            }
        }
        
        this.events.push(eventData);
        if (window.uigoUI) {
            window.uigoUI.updateStepsList(this.events);
        }
    }

    handleScrollEvent(event) {
        if (!this.recording) return;
        if (event.target === document) return;

        const target = event.target;
        const properties = this.elementFinder.getElementProperties(target);
        
        this.events.push({
            type: 'scroll',
            timestamp: Date.now(),
            target: properties,
            scrollTop: target.scrollTop,
            scrollLeft: target.scrollLeft
        });
        
        if (window.uigoUI) {
            window.uigoUI.updateStepsList(this.events);
        }
    }

    handleKeyEvent(event) {
        if (!this.recording) return;
        if (!event.target.matches('input, textarea')) return;

        const target = event.target;
        const properties = this.elementFinder.getElementProperties(target);
        
        this.events.push({
            type: 'keydown',
            timestamp: Date.now(),
            target: properties,
            key: event.key,
            value: target.value
        });
        
        if (window.uigoUI) {
            window.uigoUI.updateStepsList(this.events);
        }
    }

    determineQuadrant(event) {
        const x = event.clientX || event.touches?.[0]?.clientX;
        const y = event.clientY || event.touches?.[0]?.clientY;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        if (x < centerX && y < centerY) return 'topLeft';
        if (x >= centerX && y < centerY) return 'topRight';
        if (x < centerX && y >= centerY) return 'bottomLeft';
        return 'bottomRight';
    }

    async playRecording(recording) {
        if (this.isPlaying) return;
        
        try {
            this.isPlaying = true;
            const events = recording.events;
            for (let event of events) {
                await this.playEvent(event);
            }
        } finally {
            this.isPlaying = false;
        }
    }

    async playEvent(event) {
        if (!event || !event.xpath) {
            console.error('Invalid event or missing xpath:', event);
            return;
        }
    
        if (event.type === 'fetch') {
            // Simulate waiting for HTTP response
            console.log(`Waiting for HTTP response: ${event.method} ${event.url}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
            return;
        }
    
        const element = this.elementFinder.findElementByXPath(event.xpath);
        if (!element) {
            console.error('Element not found:', event.xpath);
            return;
        }
    
        try {
            switch (event.type) {
                case 'click':
                    await this.simulateClick(element, event);
                    break;
                case 'input':
                case 'change':
                    element.value = event.value;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                case 'keydown':
                case 'keyup':
                    element.dispatchEvent(new KeyboardEvent(event.type, {
                        key: event.key,
                        code: event.code,
                        bubbles: true
                    }));
                    break;
                case 'scroll':
                    element.scrollTop = event.scrollTop;
                    element.scrollLeft = event.scrollLeft;
                    break;
            }
        } catch (error) {
            console.error('Error playing event:', error, event);
        }
    
        // Add delay to simulate real user interaction
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async simulateClick(element, event) {
        return new Promise(resolve => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                element.click();
                resolve();
            }, 500);
        });
    }

    async simulateTouch(element, event) {
        return new Promise(resolve => {
            const touch = new Touch({
                identifier: Date.now(),
                target: element,
                clientX: event.coordinates.x,
                clientY: event.coordinates.y,
                radiusX: 2.5,
                radiusY: 2.5,
                rotationAngle: 0,
                force: 1
            });

            const touchEvent = new TouchEvent(event.type, {
                cancelable: true,
                bubbles: true,
                touches: [touch],
                targetTouches: [touch],
                changedTouches: [touch]
            });

            element.dispatchEvent(touchEvent);
            resolve();
        });
    }

    removeEventListeners() {
        document.removeEventListener('click', this.handleEvent.bind(this));
        document.removeEventListener('touchstart', this.handleEvent.bind(this));
        document.removeEventListener('touchend', this.handleEvent.bind(this));
        document.removeEventListener('change', this.handleEvent.bind(this));
        document.removeEventListener('input', this.handleEvent.bind(this));
        document.removeEventListener('scroll', this.handleScrollEvent.bind(this), true);
        document.removeEventListener('keydown', this.handleKeyEvent.bind(this));
    }

    handleInputEvent(event) {
        if (!this.recording || this.isPlaying || event.isTrusted === false) return;
        const target = event.target;
        
        if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
        
        const properties = this.elementFinder.getElementProperties(target);
        const xpath = this.elementFinder.getXPath(target);
        
        this.events.push({
            type: 'input',
            timestamp: Date.now(),
            target: properties,
            xpath: xpath,
            value: target.value,
            selectionStart: target.selectionStart,
            selectionEnd: target.selectionEnd
        });
        
        if (window.uigoUI) {
            window.uigoUI.updateStepsList(this.events);
        }
    }

    handleChangeEvent(event) {
        if (!this.recording || this.isPlaying || event.isTrusted === false) return;
        const target = event.target;
        
        if (!['SELECT'].includes(target.tagName)) return;
        
        const properties = this.elementFinder.getElementProperties(target);
        const xpath = this.elementFinder.getXPath(target);
        
        this.events.push({
            type: 'change',
            timestamp: Date.now(),
            target: properties,
            xpath: xpath,
            value: target.value,
            selectedIndex: target.selectedIndex
        });
        
        if (window.uigoUI) {
            window.uigoUI.updateStepsList(this.events);
        }
    }

    findElementAtPoint(x, y) {
        const elements = [...this.editableElements.values()];
        let target = null;
        let maxZIndex = -1;

        elements.forEach(element => {
            if (element.disabled) return;

            const rect = element.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                const zIndex = this.getZIndex(element);
                if (zIndex > maxZIndex) {
                    target = element;
                    maxZIndex = zIndex;
                }
            }
        });

        return target;
    }

    getZIndex(element) {
        if (!(element instanceof HTMLElement)) return -1;
        
        const style = window.getComputedStyle(element);
        const zIndex = parseInt(style.zIndex);
        
        if (isNaN(zIndex)) {
            return element.parentElement ? this.getZIndex(element.parentElement) : -1;
        }
        
        return zIndex;
    }

    recordHttpEvent(event) {
        if (this.recording) {
            this.httpEvents.push(event);
            if (window.uigoUI) {
                window.uigoUI.updateStepsList(this.events);
            }
        }
    }
} 
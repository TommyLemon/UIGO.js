class ElementFinder {
    constructor() {
        this.weights = {
            id: 100,
            xpath: 90,
            coordinates: 80,
            type: 70,
            className: 60,
            text: 50,
            style: 40
        };
    }

    // 获取元素所有属性
    getElementProperties(element) {
        return {
            id: element.id,
            tagName: element.tagName,
            className: element.className,
            text: element.textContent,
            type: element.type,
            href: element.href,
            rect: element.getBoundingClientRect(),
            xpath: this.getXPath(element),
            styles: window.getComputedStyle(element)
        };
    }

    // 计算元素得分
    calculateScore(element, criteria) {
        let score = 0;
        
        if (criteria.id && element.id === criteria.id) {
            score += this.weights.id;
        }
        
        if (criteria.coordinates) {
            const rect = element.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow(rect.left - criteria.coordinates.x, 2) +
                Math.pow(rect.top - criteria.coordinates.y, 2)
            );
            score += this.weights.coordinates * (1 - Math.min(distance / 100, 1));
        }

        // 其他属性匹配计算...

        return score;
    }

    // 查找最佳匹配元素
    findBestMatch(criteria) {
        const elements = document.querySelectorAll('*');
        let bestElement = null;
        let bestScore = -1;

        elements.forEach(element => {
            const score = this.calculateScore(element, criteria);
            if (score > bestScore) {
                bestScore = score;
                bestElement = element;
            }
        });

        return bestElement;
    }

    // 获取元素的 XPath
    getXPath(element) {
        if (!element) return null;
        if (element.id) return `//*[@id="${element.id}"]`;
        
        const paths = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let index = 1;
            let sibling = element.previousSibling;
            
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && 
                    sibling.tagName === element.tagName) {
                    index++;
                }
                sibling = sibling.previousSibling;
            }
            
            const tagName = element.tagName.toLowerCase();
            paths.unshift(`${tagName}[${index}]`);
            element = element.parentNode;
        }
        
        return '/' + paths.join('/');
    }

    findElementByXPath(xpath) {
        try {
            return document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (e) {
            console.error('XPath evaluation failed:', e);
            return null;
        }
    }
} 
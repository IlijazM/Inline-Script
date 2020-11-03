var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
if (!Object.entries) {
    Object.entries = function (obj) {
        let ownProps = Object.keys(obj), i = ownProps.length, resArray = new Array(i);
        while (i--)
            resArray[i] = [ownProps[i], obj[ownProps[i]]];
        return resArray;
    };
}
if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        value: function (searchElement, fromIndex) {
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            var o = Object(this);
            var len = o.length >>> 0;
            if (len === 0) {
                return false;
            }
            var n = fromIndex | 0;
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            function sameValueZero(x, y) {
                return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
            }
            while (k < len) {
                if (sameValueZero(o[k], searchElement)) {
                    return true;
                }
                k++;
            }
            return false;
        },
    });
}
HTMLElement.prototype.setUcn = function () {
    if (this.classList.contains(InlineScript.CLASS_NAME))
        return;
    this.classList.add(InlineScript.CLASS_NAME);
    this.ucn = InlineScript.inlineScriptUCN++;
    this.classList.add(InlineScript.UNIQUE_CLASS_NAME_PREFIX + this.ucn);
};
HTMLElement.prototype.removeUcn = function () {
    this.classList.remove(InlineScript.CLASS_NAME);
    this.classList.remove(InlineScript.UNIQUE_CLASS_NAME_PREFIX + this.ucn);
};
HTMLElement.prototype.setInlineScript = function (value) {
    if (this.inlineScript === undefined)
        this.inlineScript = value;
};
HTMLElement.prototype.hasInlineScript = function () {
    return this.inlineScript !== undefined;
};
HTMLElement.prototype.setInlineScriptAttributes = function (value) {
    if (this.inlineScriptAttributes !== undefined)
        return;
    this.inlineScriptAttributes = value;
};
HTMLElement.prototype.hasInlineScriptAttributes = function () {
    return this.inlineScriptAttributes !== undefined && this.inlineScriptAttributes.length > 0;
};
HTMLElement.prototype.callsFunction = function () {
    return this.functionName !== undefined;
};
const load = (url, forceFetch = false) => {
    if (forceFetch)
        InlineScript.removeFromCache(url);
    this.inlineScriptSrc = url;
    this.render(true);
};
function inlineScript() {
    const inlineScript = new InlineScriptInstance();
    [document.head, document.body].forEach((element) => inlineScript.scan(element));
    ScopedCss.scopeAllStyles();
}
const state = {
    render() {
        Array.from(document.body.children).forEach((element) => {
            if (element.render !== undefined)
                element.render();
        });
    },
};
const inlineScriptCss = document.createElement('style');
document.head.appendChild(inlineScriptCss);
inlineScriptCss.innerHTML += `function, preload { display: none !important; }`;
const ScopedCss = {
    SCOPED_CSS_PREFIX: 'scoped-css-id-',
    scopedCSSId: 0,
    cssCommentsRegex: /\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/gm,
    removeAllCssComments(css) {
        return css.replace(ScopedCss.cssCommentsRegex, '');
    },
    scope(scope, css) {
        css = this.removeAllCssComments(css);
        const regex = /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g;
        let m;
        while ((m = regex.exec(css)) !== null) {
            if (m.index === regex.lastIndex)
                regex.lastIndex++;
            let match = m[0].trim();
            const index = m.index;
            if (!match.startsWith('@') &&
                !match.startsWith('from') &&
                !match.startsWith('to') &&
                !/[\d]/.test(match.substr(0, 1))) {
                let end = css.substr(index).trim();
                if (end.startsWith('#this'))
                    end = end.substr(6);
                css = css.substring(0, index) + scope + ' ' + end;
                regex.lastIndex += scope.length + 1;
            }
        }
        return css;
    },
    getUniqueStyleClassName() {
        return ScopedCss.SCOPED_CSS_PREFIX + ScopedCss.scopedCSSId++;
    },
    getScopedStyleElements(parent) {
        return Array.from(parent.querySelectorAll('style[scoped]'));
    },
    scopeStyle(element) {
        const uniqueStyleClassName = this.getUniqueStyleClassName();
        element.parentElement.classList.add(uniqueStyleClassName);
        element.innerHTML = this.scope('.' + uniqueStyleClassName, element.innerHTML);
        element.removeAttribute('scoped');
    },
    scopeStyles(parent) {
        let styles = this.getScopedStyleElements(parent);
        styles.forEach(this.scopeStyle);
        styles = Array.from(parent.querySelectorAll('style[scope]'));
    },
    scopeAllStyles() {
        this.scopeStyles(document.querySelector('html'));
    },
};
const InlineScript = {
    reverseSanitationReplaceList: {
        '\\&gt;': '>',
        '\\&lt;': '<',
    },
    reverseSanitation(html) {
        for (const [regex, replacement] of Object.entries(InlineScript.reverseSanitationReplaceList))
            html = html.replace(new RegExp(regex, 'gm'), replacement);
        return html;
    },
    escapeAll(string) {
        return string
            .replace(/\\/gm, '\\\\')
            .replace(/\$/gm, '\\$')
            .replace(/'/gm, "\\'")
            .replace(/"/gm, '\\"')
            .replace(/`/gm, '\\`');
    },
    createElements(stringElement) {
        const parent = document.createElement('div');
        parent.innerHTML = '<div>' + stringElement + '</div>';
        return parent.firstChild.children;
    },
    getAttributesFromElementsAsArray(element) {
        return Object.entries(Array.from(element.attributes).map((attribute) => [attribute.name, attribute.value]));
    },
    substringThrow(string, start, length = undefined) {
        const res = string.substr(start, length);
        if (res === '')
            throw 'substring is out of bounce.';
        return res;
    },
    newInlineScript(element) {
        new InlineScriptInstance().scan(element);
    },
    srcCache: {},
    loadFromUrl(url, forceFetch = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let res;
            if (InlineScript.srcCache[url] === undefined || forceFetch)
                res = yield (yield fetch(url)).text();
            else
                res = InlineScript.srcCache[url];
            InlineScript.srcCache[url] = res;
            return res;
        });
    },
    removeFromCache(url) {
        InlineScript.srcCache[url] = undefined;
    },
    UNIQUE_CLASS_NAME_PREFIX: '--is-ucn-',
    inlineScriptUCN: 0,
    CLASS_NAME: '--inline-script',
    insertLexingResult(string, lexingResult) {
        return (string.substr(0, lexingResult.index) +
            lexingResult.content +
            string.substr(lexingResult.index + lexingResult.length));
    },
    generateEvalPreCode(parentElement) {
        let evalCode = '';
        evalCode +=
            'let parent=document.querySelector(".' + InlineScript.UNIQUE_CLASS_NAME_PREFIX + parentElement.ucn + '");';
        evalCode += 'let scope=parent,__parent=parent;';
        evalCode += 'let state={render(){Array.from(parent.children).forEach(_=>_.render())}};';
        return evalCode;
    },
    removeEmptySpace(string) {
        return string.replace(/\n|\s/gm, '');
    },
    convertHTMLSyntaxResultContent(content, element) {
        return ('eval(InlineScriptInstance+`' +
            InlineScript.generateEvalPreCode(element) +
            'new InlineScriptInstance().fromString(\\`' +
            content.substring(1, content.length - 1) +
            '\\`)`)');
    },
    scanHTMLSyntax(string, startIndex) {
        let result = {
            index: null,
            length: null,
            content: null,
        };
        try {
            let depth = 0;
            for (let i = startIndex; i < string.length; i++) {
                const c = InlineScript.substringThrow(string, i, 1);
                const cc = InlineScript.substringThrow(string, i, 2);
                if (['"', "'", '¸'].includes(c)) {
                    const quote = c;
                    i++;
                    while (InlineScript.substringThrow(string, i, 1) !== quote ||
                        InlineScript.substringThrow(string, i - 1, 1) === '\\')
                        i++;
                }
                if (cc === '//')
                    while (InlineScript.substringThrow(string, i, 1) !== '\n')
                        i++;
                if (InlineScript.substringThrow(string, i, 4) === '<!--')
                    while (InlineScript.substringThrow(string, i, 1) !== '\n')
                        i++;
                if (cc === '/*')
                    while (InlineScript.substringThrow(string, i, 2) !== '*/')
                        i++;
                while (InlineScript.substringThrow(string, i, 1) === '(') {
                    const bracketIndex = i;
                    i++;
                    while (/\s|\r/.test(InlineScript.substringThrow(string, i, 1)))
                        i++;
                    if (InlineScript.substringThrow(string, i, 1) === '<') {
                        depth++;
                        if (depth === 1)
                            result.index = bracketIndex;
                    }
                }
                while (InlineScript.substringThrow(string, i, 1) === '>' && depth > 0) {
                    i++;
                    while (/\s|\r/.test(InlineScript.substringThrow(string, i, 1)))
                        i++;
                    if (InlineScript.substringThrow(string, i, 1) === ')') {
                        depth--;
                        if (depth === 0) {
                            result.length = i + 1 - result.index;
                            result.content = string.substr(result.index, result.length);
                            result.content = InlineScript.escapeAll(InlineScript.escapeAll(result.content));
                            return result;
                        }
                    }
                }
            }
        }
        catch (_a) { }
        return null;
    },
    compileHTMLSyntax(inlineScript, element) {
        inlineScript = InlineScript.reverseSanitation(inlineScript);
        let lexingResult, lastIndex = 0;
        while ((lexingResult = InlineScript.scanHTMLSyntax(inlineScript, lastIndex))) {
            lexingResult.content = InlineScript.convertHTMLSyntaxResultContent(lexingResult.content, element);
            inlineScript = InlineScript.insertLexingResult(inlineScript, lexingResult);
            lastIndex = lexingResult.index + lexingResult.content.length;
        }
        return inlineScript;
    },
    generatesChildElements(element) {
        return element.functionName !== undefined || element.inlineScriptSrc !== undefined;
    },
    evalResultHandler: {
        handleEvalResultUndefined(element, result) {
            return result === undefined;
        },
        handleEvalResultHTMLCollection(element, result) {
            if (!(result instanceof HTMLCollection))
                return;
            Array.from(result).forEach((child) => element.append(child));
            ScopedCss.scopeStyles(element);
            return true;
        },
        handleEvalResultHTMLElement(element, result) {
            if (!(result instanceof HTMLElement))
                return;
            element.append(result);
            ScopedCss.scopeStyles(element);
            return true;
        },
        handleEvalResultArray(element, result) {
            if (!(result instanceof Array))
                return;
            result.forEach((child) => {
                this.handleInlineScriptEvalResult(element, child);
            });
            return true;
        },
        handleEvalResultPromise(element, result) {
            if (!(result instanceof Promise))
                return;
            result
                .then((res) => {
                this.handleInlineScriptEvalResult(element, res);
            })
                .catch((res) => {
                this.handleExceptionResult(element, res);
            });
            return true;
        },
    },
    handleEvalResult(element, result, clear = false) {
        if (clear)
            element.innerHTML = '';
        for (const [functionName, functionValue] of Object.entries(this.evalResultHandler)) {
            if (functionValue(element, result))
                return;
        }
        element.innerHTML += result.toString();
        return;
    },
    handleResult(result) {
        if (result === undefined)
            return '';
        if (typeof result === 'string')
            return result;
        if (typeof result === 'number')
            return result.toString();
        if (result instanceof Array)
            return result.join('');
        return JSON.stringify(result);
    },
    handleExceptionResult(element, error) {
        console.error(error);
        element.style.background = 'red';
        element.style.color = 'yellow';
        element.style.fontSize = '20px';
        element.innerHTML = error;
    },
    scanAttributes(element) {
        const attributes = Array.from(element.attributes);
        const inlineScriptAttributes = [];
        attributes.forEach((attribute) => {
            if (attribute.value.trim().startsWith('{')) {
                inlineScriptAttributes.push(attribute);
            }
        });
        element.inlineScriptAttributes = inlineScriptAttributes;
    },
    getFirstAttributeName(element) {
        const attributes = element.attributes;
        if (attributes.length === 0)
            return '';
        return attributes[0].name;
    },
    hasReaction(element) {
        return element.hasAttribute('reacts');
    },
    tagNameUsesSrcAttribute(element) {
        return InlineScript.tagNamesUsingSrcAttribute.includes(element.tagName);
    },
    hasValidSrcAttribute(element) {
        return element.hasAttribute('src') && !InlineScript.tagNameUsesSrcAttribute(element);
    },
    handleSrcAttribute(element) {
        const src = element.getAttribute('src');
        element.inlineScriptSrc = src;
    },
    hasEventAttribute(element) {
        return Array.from(element.attributes).findIndex((attribute) => attribute.name.startsWith('on')) !== -1;
    },
    hasInnerHTMLAttribute(element) {
        return element.hasAttribute('innerhtml');
    },
    handleInnerHTMLAttribute(element) {
        if (this.hasInnerHTMLAttribute(element))
            element.innerHTML = element.getAttribute('innerhtml');
        else
            element.innerHTML = '';
    },
    hasInlineScript(element) {
        return element.innerHTML.trim().startsWith('{');
    },
    checksInlineScript(element) {
        if (!InlineScript.hasInlineScript(element))
            return;
        element.setUcn();
        element.setInlineScript(InlineScript.compileHTMLSyntax(element.innerHTML, element));
    },
    functions: {},
    isFunction(element) {
        return element.tagName === 'FUNCTION';
    },
    compileFunction(element) {
        if (element.attributes.length < 1)
            return true;
        const name = element.attributes[0].name;
        InlineScript.functions[name.toUpperCase()] = element.innerHTML;
        return true;
    },
    callsFunction(element) {
        return Object.keys(InlineScript.functions).includes(element.tagName);
    },
    handleCallsFunction(element) {
        element.functionName = element.tagName;
    },
    isPreLoad(element) {
        return element.tagName === 'PRELOAD';
    },
    preLoad(element) {
        if (!element.hasAttribute('src'))
            return true;
        const src = element.getAttribute('src');
        InlineScript.loadFromUrl(src);
        return true;
    },
    ignoredTagNameList: ['SCRIPT', 'STYLE', 'LINK', 'META'],
    ignoreDueToTagName(element) {
        return InlineScript.ignoredTagNameList.includes(element.tagName);
    },
    scanTagName(element) {
        if (InlineScript.ignoreDueToTagName(element))
            return true;
        if (InlineScript.isFunction(element))
            return InlineScript.compileFunction(element);
        if (InlineScript.callsFunction(element))
            return InlineScript.handleCallsFunction(element);
        if (InlineScript.isPreLoad(element))
            return InlineScript.preLoad(element);
    },
    shouldScanChildren(element) {
        return !element.hasInlineScript() && element.inlineScriptSrc === undefined;
    },
    invalidScriptParent: [document.body, document.head],
    isValidScriptTag(element) {
        return element.tagName === 'SCRIPT' && InlineScript.invalidScriptParent.includes(element.parentElement);
    },
    filterScripts(elements) {
        const scriptElements = [];
        for (const element of elements)
            InlineScript.isValidScriptTag(element) && scriptElements.push(element);
        return scriptElements;
    },
    isStatic(element) {
        var _a;
        return element.hasAttribute('static') || ((_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.hasAttribute('static'));
    },
    tagNamesUsingSrcAttribute: ['AUDIO', 'EMBED', 'IFRAME', 'IMG', 'INPUT', 'SCRIPT', 'SOURCE', 'TRACK', 'VIDEO'],
    REACTION_INTERVAL_TIME: 50,
};
class InlineScriptInstance {
    constructor() {
        this.reactiveElements = {};
        this.oldValues = {};
        this.setupReaction();
    }
    setupReaction() {
        setInterval(() => {
            this.reaction();
        }, InlineScript.REACTION_INTERVAL_TIME);
    }
    reaction() {
        for (const [varName, reactiveElements] of Object.entries(this.reactiveElements)) {
            const varValue = eval(varName);
            if (this.oldValues[varName] !== varValue) {
                this.oldValues[varName] = varValue;
                for (const reactiveElement of reactiveElements) {
                    function remove() {
                        reactiveElements[varName] = reactiveElements.filter((element) => element === reactiveElement);
                    }
                    if (reactiveElement.parentElement === null)
                        remove();
                    reactiveElement.render(false);
                }
            }
        }
    }
    setRenderFunction(element) {
        const that = this;
        let newVars = {};
        element.render = function (calledAutomatically = false) {
            if (element.static)
                return;
            element.inlineScriptAttributes.forEach(({ name, value }) => {
                const res = InlineScript.handleResult(eval(value));
                element.setAttribute(name, res);
            });
            if (element.fixedHTML)
                return InlineScript.handleInnerHTMLAttribute(element);
            if (InlineScript.generatesChildElements(element)) {
                const virtualElement = document.createElement('div');
                try {
                    InlineScript.handleEvalResult(virtualElement, eval(element.inlineScript), true);
                }
                catch (err) {
                    InlineScript.handleExceptionResult(virtualElement, err);
                }
                newVars.innerHTML = virtualElement.innerHTML;
                newVars.args = InlineScript.getAttributesFromElementsAsArray(this);
            }
            if (element.callsFunction()) {
                const { innerHTML, args } = newVars;
                element.innerHTML = InlineScript.functions[element.functionName];
                eval(InlineScript.generateEvalPreCode(element) + 'new InlineScriptInstance().scanAll(element.children)');
                return;
            }
            if (element.hasInlineScript()) {
                try {
                    InlineScript.handleEvalResult(element, eval(element.inlineScript), true);
                }
                catch (err) {
                    InlineScript.handleExceptionResult(element, err);
                }
                return;
            }
            if (element.inlineScriptSrc !== undefined) {
                return InlineScript.loadFromUrl(element.inlineScriptSrc).then((content) => {
                    const { innerHTML, args } = newVars;
                    InlineScript.handleEvalResult(element, eval(InlineScript.generateEvalPreCode(element) +
                        'new InlineScriptInstance().fromString(`' +
                        InlineScript.escapeAll(content) +
                        '`);'), true);
                });
            }
            if (!calledAutomatically)
                that.scan(element);
        };
    }
    handleAttributes(element) {
        if (InlineScript.hasReaction(element))
            this.addReaction(element);
        if (InlineScript.hasValidSrcAttribute(element))
            InlineScript.handleSrcAttribute(element);
        if (InlineScript.hasEventAttribute(element))
            this.handleEventAttributes(element);
        if (InlineScript.hasInnerHTMLAttribute(element))
            element.fixedHTML = true;
    }
    addReaction(element) {
        const varName = element.getAttribute('reacts');
        if (this.reactiveElements[varName] === undefined)
            this.reactiveElements[varName] = [];
        this.reactiveElements[varName].push(element);
    }
    handleEventAttributes(element) {
        const attributes = Array.from(element.attributes).filter((attribute) => attribute.name.startsWith('on'));
        attributes.forEach((attribute) => {
            let value = attribute.value;
            if (!value) {
                value = element.innerHTML;
                element.fixedHTML = true;
            }
            element.setAttribute(attribute.name, '');
            element[attribute.name] = function (event) {
                eval(value);
            };
        });
    }
    scan(element, recursive = true) {
        if (element === undefined)
            return;
        if (InlineScript.scanTagName(element))
            return;
        InlineScript.scanAttributes(element);
        InlineScript.checksInlineScript(element);
        this.setRenderFunction(element);
        this.handleAttributes(element);
        if (InlineScript.isStatic(element))
            element.setAttribute('static', 'true');
        element.render(true);
        if (element.hasAttribute('static'))
            element.static = true;
        if (recursive && InlineScript.shouldScanChildren(element))
            this.scanAll(element.children);
    }
    scanAll(elements) {
        const scriptElements = InlineScript.filterScripts(elements);
        if (scriptElements.length !== 0) {
            const elementsLeft = Array.from(elements).filter((element) => !scriptElements.includes(element));
            eval(scriptElements.map((scriptElement) => scriptElement.innerHTML + ';\n').join('') +
                InlineScriptInstance +
                'new InlineScriptInstance().scanAll(elementsLeft)');
            return;
        }
        for (const element of elements) {
            if (element.hasAttribute('dynamic')) {
                InlineScript.newInlineScript(element);
            }
            else {
                this.scan(element);
            }
        }
    }
    fromString(stringElement) {
        const elements = InlineScript.createElements(stringElement);
        this.scanAll(elements);
        return elements;
    }
}

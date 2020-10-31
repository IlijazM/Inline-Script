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
    if (this.classList.contains(CLASS_NAME))
        return;
    this.classList.add(CLASS_NAME);
    this.ucn = inlineScriptUCN++;
    this.classList.add(UNIQUE_CLASS_NAME_PREFIX + this.ucn);
};
HTMLElement.prototype.removeUcn = function () {
    this.classList.remove(CLASS_NAME);
    this.classList.remove(UNIQUE_CLASS_NAME_PREFIX + this.ucn);
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
const UNIQUE_CLASS_NAME_PREFIX = '--is-ucn-';
var inlineScriptUCN = 0;
const CLASS_NAME = '--inline-script';
const SCOPED_CSS_PREFIX = 'scoped-css-id-';
let scopedCSSId = 0;
const reverseSanitationReplaceList = {
    '\\&gt;': '>',
    '\\&lt;': '<',
};
const cssCommentsRegex = /\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/gm;
const tagNamesUsingSrcAttribute = ['AUDIO', 'EMBED', 'IFRAME', 'IMG', 'INPUT', 'SCRIPT', 'SOURCE', 'TRACK', 'VIDEO'];
const ignoredTagNameList = ['SCRIPT', 'STYLE', 'LINK', 'META'];
const noRenderingTagNameList = ['FUNCTION'];
let functions = {};
let srcCache = {};
var __parent;
function load(url, forceFetch = false) {
    if (forceFetch)
        removeFromCache(url);
    this.inlineScriptSrc = url;
    this.render(true);
}
const loadFromUrl = (url, forceFetch = false) => __awaiter(this, void 0, void 0, function* () {
    let res;
    if (srcCache[url] === undefined || forceFetch)
        res = yield (yield fetch(url)).text();
    else
        res = srcCache[url];
    srcCache[url] = res;
    return res;
});
function removeFromCache(url) {
    srcCache[url] = undefined;
}
function reverseSanitation(html) {
    for (const [regex, replacement] of Object.entries(reverseSanitationReplaceList))
        html = html.replace(new RegExp(regex, 'gm'), replacement);
    return html;
}
function escapeAll(string) {
    return string
        .replace(/\\/gm, '\\\\')
        .replace(/\$/gm, '\\$')
        .replace(/'/gm, "\\'")
        .replace(/"/gm, '\\"')
        .replace(/`/gm, '\\`');
}
function createElements(stringElement) {
    const parent = document.createElement('div');
    parent.innerHTML = '<div>' + stringElement + '</div>';
    return parent.firstChild.children;
}
function getAttributesFromElementsAsArray(element) {
    return Object.entries(Array.from(element.attributes).map((attribute) => [attribute.name, attribute.value]));
}
function substringThrow(string, start, length = undefined) {
    const res = string.substr(start, length);
    if (res === '')
        throw 'substring is out of bounce.';
    return res;
}
const scopedCss = {
    removeAllCssComments(css) {
        return css.replace(cssCommentsRegex, '');
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
        return SCOPED_CSS_PREFIX + scopedCSSId++;
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
const inlineScriptCss = document.createElement('style');
document.head.appendChild(inlineScriptCss);
inlineScriptCss.innerHTML += `function { display: none !important; }`;
function handleInlineScriptEvalResultUndefined(result) {
    return result === undefined;
}
function handleInlineScriptEvalResultHTMLCollection(element, result) {
    if (!(result instanceof HTMLCollection))
        return;
    Array.from(result).forEach((child) => element.append(child));
    scopedCss.scopeStyles(element);
    return true;
}
function handleInlineScriptEvalResultHTMLElement(element, result) {
    if (!(result instanceof HTMLElement))
        return;
    element.append(result);
    scopedCss.scopeStyles(element);
    return true;
}
function handleInlineScriptEvalResultArray(element, result) {
    if (!(result instanceof Array))
        return;
    result.forEach((child) => {
        handleInlineScriptEvalResult(element, child);
    });
    return true;
}
function handleInlineScriptEvalResultPromise(element, result) {
    if (!(result instanceof Promise))
        return;
    result
        .then((res) => {
        handleInlineScriptEvalResult(element, res);
    })
        .catch((res) => {
        handleExceptionResult(element, res);
    });
    return true;
}
function handleInlineScriptEvalResult(element, result, clear = false) {
    if (clear)
        element.innerHTML = '';
    if (handleInlineScriptEvalResultUndefined(result))
        return;
    if (handleInlineScriptEvalResultHTMLCollection(element, result))
        return;
    if (handleInlineScriptEvalResultHTMLElement(element, result))
        return;
    if (handleInlineScriptEvalResultArray(element, result))
        return;
    if (handleInlineScriptEvalResultPromise(element, result))
        return;
    element.innerHTML += result.toString();
    return;
}
function handleResult(result) {
    if (result === undefined)
        return '';
    if (typeof result === 'string')
        return result;
    if (typeof result === 'number')
        return result.toString();
    if (result instanceof Array)
        return result.join('');
    return JSON.stringify(result);
}
function handleExceptionResult(element, error) {
    console.error(error);
    element.style.background = 'red';
    element.style.color = 'yellow';
    element.style.fontSize = '20px';
    element.innerHTML = error;
}
const InlineScript = {
    generateEvalPreCode(parentElement) {
        let evalCode = '';
        evalCode += 'let parent=document.querySelector(".' + UNIQUE_CLASS_NAME_PREFIX + parentElement.ucn + '");';
        evalCode += 'let scope=parent,__parent=parent;';
        evalCode += 'let state={render(){Array.from(parent.children).forEach(_=>_.render())}};';
        return evalCode;
    },
    compileHTMLSyntax(inlineScript, element) {
        inlineScript = reverseSanitation(inlineScript);
        let depth = 0;
        let newInlineScript = '';
        try {
            for (let i = 0; i < inlineScript.length; i++) {
                let c = substringThrow(inlineScript, i, 1);
                let cc = substringThrow(inlineScript, i, 2);
                function find(char) {
                    const sub = substringThrow(inlineScript, i);
                    const j = sub.indexOf(char);
                    return substringThrow(sub, 0, j + 1);
                }
                function expect(expect, char) {
                    return find(char).replace(/\n|\s/gm, '') === expect;
                }
                if (cc === '//') {
                    while (substringThrow(inlineScript, i, 1) !== '\n') {
                        newInlineScript += substringThrow(inlineScript, i, 1);
                        i++;
                    }
                    i--;
                    continue;
                }
                if (c === '(' && expect('(<', '<')) {
                    depth++;
                    if (depth === 1) {
                        let evalCode = '';
                        evalCode += 'eval(InlineScriptInstance+`';
                        evalCode += this.generateEvalPreCode(element);
                        evalCode += 'new InlineScriptInstance().fromString(\\`<';
                        newInlineScript += evalCode;
                        i++;
                        continue;
                    }
                }
                if (c === '>' && expect('>)', ')')) {
                    depth--;
                    if (depth === 0) {
                        newInlineScript += '>\\`)`)';
                        i++;
                        continue;
                    }
                }
                if (depth !== 0)
                    c = escapeAll(escapeAll(c));
                newInlineScript += c;
            }
        }
        catch (_a) { }
        return newInlineScript;
    },
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
        }, 50);
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
                    try {
                        reactiveElement.render();
                    }
                    catch (err) {
                        console.group('removed element');
                        console.error(err);
                        console.log(reactiveElement);
                        console.groupEnd();
                        remove();
                    }
                }
            }
        }
    }
    addReaction(element) {
        const varName = element.getAttribute('reacts');
        if (this.reactiveElements[varName] === undefined)
            this.reactiveElements[varName] = [];
        this.reactiveElements[varName].push(element);
    }
    hasReaction(element) {
        return element.hasAttribute('reacts');
    }
    setRenderFunction(element) {
        const that = this;
        let newVars = {};
        element.render = function (calledAutomatically = false) {
            if (element.static)
                return;
            element.inlineScriptAttributes.forEach(({ name, value }) => {
                const res = handleResult(eval(value));
                element.setAttribute(name, res);
            });
            if (element.fixedHTML)
                return that.handleInnerHTMLAttribute(element);
            if (element.functionName !== undefined || element.inlineScriptSrc !== undefined) {
                const virtualElement = document.createElement('div');
                try {
                    handleInlineScriptEvalResult(virtualElement, eval(element.inlineScript), true);
                }
                catch (err) {
                    handleExceptionResult(virtualElement, err);
                }
                newVars.innerHTML = virtualElement.innerHTML;
                newVars.args = getAttributesFromElementsAsArray(this);
            }
            if (element.functionName !== undefined) {
                const innerHTML = newVars.innerHTML;
                const args = newVars.args;
                element.innerHTML = functions[element.functionName];
                eval(InlineScriptInstance + 'new InlineScriptInstance().scanAll(element.children)');
                return;
            }
            if (element.hasInlineScript()) {
                try {
                    handleInlineScriptEvalResult(element, eval(element.inlineScript), true);
                }
                catch (err) {
                    handleExceptionResult(element, err);
                }
                return;
            }
            if (element.inlineScriptSrc !== undefined) {
                return loadFromUrl(element.inlineScriptSrc).then((content) => __awaiter(this, void 0, void 0, function* () {
                    const innerHTML = newVars.innerHTML;
                    const args = newVars.args;
                    handleInlineScriptEvalResult(element, eval(InlineScriptInstance +
                        InlineScript.generateEvalPreCode(element) +
                        'new InlineScriptInstance().fromString(`' +
                        escapeAll(content) +
                        '`);'), true);
                }));
            }
            if (!calledAutomatically)
                that.scan(element);
        };
    }
    compileInlineScript(element) {
        if (!this.isInlineScript(element))
            return;
        element.setUcn();
        element.setInlineScript(InlineScript.compileHTMLSyntax(element.innerHTML, element));
    }
    isInlineScript(element) {
        return element.innerHTML.trim().startsWith('{');
    }
    compileAttributes(element) {
        const attributes = Array.from(element.attributes);
        const inlineScriptAttributes = [];
        attributes.forEach((attribute) => {
            if (attribute.value.trim().startsWith('{')) {
                inlineScriptAttributes.push(attribute);
            }
        });
        element.inlineScriptAttributes = inlineScriptAttributes;
    }
    handleAttributes(element) {
        this.hasReaction(element) && this.addReaction(element);
        this.hasValidSrcAttribute(element) && this.handleSrcAttribute(element);
        this.hasEventAttribute(element) && this.handleEventAttributes(element);
        if (this.hasInnerHTMLAttribute(element))
            element.fixedHTML = true;
    }
    getFirstAttributeName(element) {
        const attributes = element.attributes;
        if (attributes.length === 0)
            return '';
        return attributes[0].name;
    }
    hasEventAttribute(element) {
        return Array.from(element.attributes).findIndex((attribute) => attribute.name.startsWith('on')) !== -1;
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
    hasInnerHTMLAttribute(element) {
        return element.hasAttribute('innerhtml');
    }
    handleInnerHTMLAttribute(element) {
        if (this.hasInnerHTMLAttribute(element))
            element.innerHTML = element.getAttribute('innerhtml');
        else
            element.innerHTML = '';
    }
    hasValidSrcAttribute(element) {
        return element.hasAttribute('src') && !tagNamesUsingSrcAttribute.includes(element.tagName);
    }
    handleSrcAttribute(element) {
        const src = element.getAttribute('src');
        element.inlineScriptSrc = src;
    }
    ignoreDueToTagName(element) {
        return ignoredTagNameList.includes(element.tagName);
    }
    checkTagName(element) {
        if (this.ignoreDueToTagName(element))
            return true;
        if (this.isMacro(element))
            return this.compileMacro(element);
        if (this.isFunction(element))
            return this.compileFunction(element);
        if (this.isPreLoad(element))
            return this.preLoad(element);
    }
    isMacro(element) {
        return element.tagName === 'DEFINE';
    }
    compileMacro(element) {
        return true;
    }
    isFunction(element) {
        return element.tagName === 'FUNCTION';
    }
    compileFunction(element) {
        if (element.attributes.length < 1)
            return true;
        const name = element.attributes[0].name;
        functions[name.toUpperCase()] = element.innerHTML;
        return true;
    }
    callsFunction(element) {
        if (!Object.keys(functions).includes(element.tagName))
            return;
        element.functionName = element.tagName;
    }
    isPreLoad(element) {
        return element.tagName === 'PRELOAD';
    }
    preLoad(element) {
        if (!element.hasAttribute('src'))
            return true;
        const src = element.getAttribute('src');
        loadFromUrl(src);
        element.style.display = 'none';
        return true;
    }
    shouldScanChildren(element) {
        return !element.hasInlineScript() && element.inlineScriptSrc === undefined;
    }
    isStatic(element) {
        var _a;
        return (element.hasAttribute('static') || (__parent === null || __parent === void 0 ? void 0 : __parent.hasAttribute('static')) || ((_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.hasAttribute('static')));
    }
    scan(element, recursive = true) {
        if (element === undefined)
            return;
        if (this.checkTagName(element))
            return;
        this.callsFunction(element);
        this.compileAttributes(element);
        this.compileInlineScript(element);
        this.setRenderFunction(element);
        this.handleAttributes(element);
        if (this.isStatic(element))
            element.setAttribute('static', 'true');
        if (!noRenderingTagNameList.includes(element.tagName))
            element.render(true);
        if (element.hasAttribute('static'))
            element.static = true;
        if (recursive && this.shouldScanChildren(element))
            this.scanAll(element.children);
    }
    isValidScriptTag(element) {
        return (element.tagName === 'SCRIPT' && element.parentElement !== document.body && element.parentElement !== document.head);
    }
    filterScripts(elements) {
        const scriptElements = [];
        for (const element of elements)
            this.isValidScriptTag(element) && scriptElements.push(element);
        return scriptElements;
    }
    scanAll(elements) {
        const scriptElements = this.filterScripts(elements);
        if (scriptElements.length !== 0) {
            const elementsLeft = Array.from(elements).filter((element) => !scriptElements.includes(element));
            eval(scriptElements.map((scriptElement) => scriptElement.innerHTML + ';\n').join('') +
                InlineScriptInstance +
                'new InlineScriptInstance().scanAll(elementsLeft)');
            return;
        }
        for (const element of elements) {
            if (element.hasAttribute('dynamic')) {
                newInlineScript(element);
            }
            else {
                this.scan(element);
            }
        }
    }
    fromString(stringElement) {
        const elements = createElements(stringElement);
        this.scanAll(elements);
        return elements;
    }
}
function inlineScript() {
    const inlineScript = new InlineScriptInstance();
    [document.head, document.body].forEach((element) => inlineScript.scan(element));
    scopedCss.scopeAllStyles();
}
function newInlineScript(element) {
    new InlineScriptInstance().scan(element);
}
const state = {
    render() {
        Array.from(document.body.children).forEach((_) => {
            if (_.render !== undefined)
                _.render();
        });
    },
};
const res = InlineScript.compileHTMLSyntax(`{{
  const bar = 10;

 // (<h1>bar</h1>)
}}`, document.head.children[0]);
console.log(res);

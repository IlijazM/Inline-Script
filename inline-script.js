var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
HTMLElement.prototype.setStatic = function () {
    this.render();
    this.render = function () { };
    this.removeUcn();
    this.inlineScript = undefined;
    this.inlineScriptAttributes = undefined;
};
HTMLElement.prototype.initialContent = {
    set(value) {
        if (this._initialContent === undefined)
            this._initialContent = value;
    },
    get() {
        return this._initialContent;
    },
};
HTMLElement.prototype.setInlineScript = function (value) {
    if (this.inlineScript !== undefined)
        return;
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
    return this.inlineScriptAttributes !== undefined;
};
const UNIQUE_CLASS_NAME_PREFIX = '--is-ucn-';
const CLASS_NAME = '--inline-script';
var inlineScriptUCN = 0;
const replaceList = {
    '\\&gt;': '>',
    '\\&lt;': '<',
};
const tagNamesUsingSrc = ['AUDIO', 'EMBED', 'IFRAME', 'IMG', 'INPUT', 'SCRIPT', 'SOURCE', 'TRACK', 'VIDEO'];
const ignoredTagNameList = ['SCRIPT', 'STYLE', 'LINK', 'META'];
let srcCache = {};
function load(element, url) {
    element.inlineScriptSrc = url;
    element.render();
}
function loadFromUrl(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let res;
        if (srcCache[url] === undefined)
            res = yield (yield fetch(url)).text();
        else
            res = srcCache[url];
        srcCache[url] = res;
        return res;
    });
}
function reverseSanitation(html) {
    for (const [regex, replacement] of Object.entries(replaceList))
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
const CSSCommentsRegex = /\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/g;
function removeAllCssComments(css) {
    return css.replace(CSSCommentsRegex, '');
}
function scope(scope, css) {
    css = removeAllCssComments(css);
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
}
let scopedCSSId = 0;
function getUniqueStyleClassName() {
    return 'scoped-css-id-' + scopedCSSId++;
}
function getScopedStyleElements(parent) {
    return Array.from(parent.querySelectorAll('style[scoped]'));
}
function scopeStyle(element) {
    const uniqueStyleClassName = getUniqueStyleClassName();
    element.parentElement.classList.add(uniqueStyleClassName);
    element.innerHTML = scope('.' + uniqueStyleClassName, element.innerHTML);
    element.removeAttribute('scoped');
}
function scopeStyles(parent) {
    let styles = getScopedStyleElements(parent);
    styles.forEach(scopeStyle);
    styles = Array.from(parent.querySelectorAll('style[scope]'));
}
function scopeAllStyles() {
    scopeStyles(document.querySelector('html'));
}
function generateEvalPreCode(element) {
    let evalCode = '';
    evalCode += 'let parent=document.querySelector(".' + UNIQUE_CLASS_NAME_PREFIX + element.ucn + '");';
    evalCode += 'let scope=parent;';
    evalCode += 'let state={render(){Array.from(parent.children).forEach(_=>_.render())}};';
    return evalCode;
}
function compileHTMLSyntax(inlineScript, element) {
    inlineScript = reverseSanitation(inlineScript);
    let inQuotes = '';
    let escapeQuotes = false;
    let htmlExpressionDepth = 0;
    let newInlineScript = '';
    for (let i = 0; i < inlineScript.length; i++) {
        let c = inlineScript.substr(i, 1);
        if (htmlExpressionDepth !== 0) {
            c = escapeAll(escapeAll(c));
        }
        function find(char) {
            const sub = inlineScript.substr(i);
            const j = sub.indexOf(char);
            return sub.substring(0, j + 1);
        }
        if (inQuotes === '') {
            if (c === '"' || c === "'" || c === '`') {
                inQuotes = c;
            }
        }
        else if (c === inQuotes && escapeQuotes === false) {
            inQuotes = '';
        }
        escapeQuotes = false;
        if (inQuotes !== '' && c === '\\') {
            escapeQuotes = true;
        }
        if (inQuotes === '') {
            if (c === '(' && find('<').split(' ').join('').split('\n').join('') === '(<') {
                htmlExpressionDepth++;
                if (htmlExpressionDepth === 1) {
                    let evalCode = '';
                    evalCode += 'eval(InlineScript+`';
                    evalCode += generateEvalPreCode(element);
                    evalCode += 'new InlineScript().fromString(\\`<';
                    newInlineScript += evalCode;
                    i++;
                    continue;
                }
            }
        }
        if (inQuotes === '') {
            if (c === '>' && find(')').split(' ').join('').split('\n').join('') === '>)') {
                htmlExpressionDepth--;
                if (htmlExpressionDepth === 0) {
                    newInlineScript += '>\\`)`)';
                    i++;
                    continue;
                }
            }
        }
        newInlineScript += c;
    }
    return newInlineScript;
}
function handleInlineScriptEvalResultUndefined(result) {
    return result === undefined;
}
function handleInlineScriptEvalResultHTMLCollection(element, result) {
    if (!(result instanceof HTMLCollection))
        return;
    Array.from(result).forEach((child) => element.append(child));
    scopeStyles(element);
    return true;
}
function handleInlineScriptEvalResultHTMLElement(element, result) {
    if (!(result instanceof HTMLElement))
        return;
    element.append(result);
    scopeStyles(element);
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
function handleExceptionResult(element, error) {
    console.error(error);
    element.style.background = 'red';
    element.style.color = 'yellow';
    element.style.fontSize = '20px';
    element.innerHTML = error;
}
class InlineScript {
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
        element.render = function () {
            if (element.static)
                return;
            if (element.hasInlineScript()) {
                try {
                    handleInlineScriptEvalResult(element, eval(element.inlineScript), true);
                }
                catch (err) {
                    handleExceptionResult(element, err);
                }
            }
            if (element.inlineScriptSrc !== undefined) {
                loadFromUrl(element.inlineScriptSrc).then((content) => __awaiter(this, void 0, void 0, function* () {
                    handleInlineScriptEvalResult(element, eval(InlineScript + generateEvalPreCode(element) + 'new InlineScript().fromString(`' + content + '`);'), true);
                }));
            }
        };
    }
    compileInlineScript(element) {
        if (!this.isInlineScript(element))
            return;
        element.setUcn();
        element.setInlineScript(compileHTMLSyntax(element.innerHTML, element));
    }
    isInlineScript(element) {
        return element.innerHTML.trim().startsWith('{');
    }
    compileAttributes(element) { }
    renderAttributes(element) { }
    handleAttributes(element) {
        element.hasAttribute('static') && element.setStatic();
        this.hasReaction(element) && this.addReaction(element);
        this.hasValidSrcAttribute(element) && this.handleSrcAttribute(element);
    }
    getFirstAttributeName(element) {
        const attributes = element.attributes;
        if (attributes.length === 0)
            return '';
        return attributes[0].name;
    }
    hasValidSrcAttribute(element) {
        return element.hasAttribute('src') && !tagNamesUsingSrc.includes(element.tagName);
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
        return true;
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
    scan(element, recursive = true) {
        if (this.checkTagName(element))
            return;
        this.compileAttributes(element);
        this.compileInlineScript(element);
        this.setRenderFunction(element);
        this.handleAttributes(element);
        element.render();
        if (recursive && !element.hasInlineScript())
            this.scanAll(element.children);
    }
    scanAll(elements) {
        for (const element of elements)
            this.scan(element);
    }
    fromString(stringElement) {
        const elements = createElements(stringElement);
        for (const element of elements)
            this.scan(element);
        return elements;
    }
}
function inlineScript() {
    const inlineScript = new InlineScript();
    inlineScript.scan(document.body);
    scopeAllStyles();
}

HTMLElement.prototype.render = function () { };
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
    if (this.inlineScript === undefined)
        this.inlineScript = value;
};
HTMLElement.prototype.hasInlineScript = function () {
    return this.inlineScript !== undefined;
};
HTMLElement.prototype.setInlineScriptAttributes = function (value) {
    if (this.inlineScriptAttributes === undefined)
        this.inlineScriptAttributes = value;
};
HTMLElement.prototype.hasInlineScriptAttributes = function () {
    return this.inlineScriptAttributes !== undefined;
};
const UNIQUE_CLASS_NAME_PREFIX = '--is-uid-';
const CLASS_NAME = '--inline-script';
var inlineScriptUniqueId = 0;
const replaceList = {
    '\\&gt;': '>',
    '\\&lt;': '<',
};
function reverseSanitation(html) {
    for (const [regex, replacement] of Object.entries(replaceList))
        html = html.replace(new RegExp(regex, 'gm'), replacement);
    return html;
}
function handleInlineScriptEvalResultUndefined(result) {
    return result === undefined;
}
function handleInlineScriptEvalResultHTMLCollection(element, result) {
    if (!(result instanceof HTMLCollection))
        return;
    Array.from(result).forEach((child) => element.append(child));
    return true;
}
function handleInlineScriptEvalResultHTMLElement(element, result) {
    if (!(result instanceof HTMLElement))
        return;
    element.append(result);
    return true;
}
function isHTMLElementArray(result) {
    return result.every((i) => i instanceof HTMLElement);
}
function handleInlineScriptEvalResultArray(element, result) {
    if (!(result instanceof Array))
        return;
    if (isHTMLElementArray(result))
        result.forEach((child) => element.append(child));
    else
        element.innerHTML = result.join('');
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
function handleInlineScriptEvalResult(element, result) {
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
    element.innerHTML = result.toString();
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
    constructor() { }
    setRenderFunction(element) {
        element.render = function () {
            if (element.hasInlineScript()) {
                try {
                    handleInlineScriptEvalResult(element, eval(element.inlineScript));
                }
                catch (err) {
                    handleExceptionResult(element, err);
                }
            }
        };
    }
    compileInlineScript(element) {
        if (!this.isInlineScript(element))
            return;
        element.setInlineScript(reverseSanitation(element.innerHTML));
    }
    isInlineScript(element) {
        return element.innerHTML.trim().startsWith('{');
    }
    compileAttributes(element) { }
    renderAttributes(element) { }
    getFirstAttributeName(element) {
        const attributes = element.attributes;
        if (attributes.length === 0)
            return '';
        return attributes[0].name;
    }
    compileTagName(element) {
        if (this.isMacro(element))
            return this.handleMacro(element);
        if (this.isFunction(element))
            return this.handleFunction(element);
    }
    isMacro(element) {
        return element.tagName === 'define';
    }
    handleMacro(element) { }
    isFunction(element) {
        return element.tagName === 'function';
    }
    handleFunction(element) { }
    hasInlineScript(element) {
        return element.hasInlineScript() || element.hasInlineScriptAttributes();
    }
    setClassName(element) {
        element.classList.add(CLASS_NAME);
    }
    setUniqueClassName(element) {
        element.classList.add(UNIQUE_CLASS_NAME_PREFIX + inlineScriptUniqueId++);
    }
    compile(element) {
        this.compileAttributes(element);
        this.compileTagName(element);
        this.compileInlineScript(element);
    }
    setup(element) {
        if (!this.hasInlineScript(element))
            return;
        this.setClassName(element);
        this.setUniqueClassName(element);
        this.setRenderFunction(element);
    }
    scan(element, recursive = true) {
        this.compile(element);
        this.setup(element);
        element.render();
        if (recursive)
            this.scanAll(element.children);
    }
    scanAll(elements) {
        for (const element of elements)
            this.scan(element);
    }
}
function inlineScript() {
    const inlineScript = new InlineScript();
    inlineScript.scan(document.body);
}

HTMLElement.prototype.render = function () { };
HTMLElement.prototype.setStatic = function () {
    this.render = function () { };
    this.inlineScript = undefined;
    this.inlineScriptAttributes = undefined;
};
HTMLElement.prototype.getUniqueSelector = function () {
    let uniqueSelector = '';
    let parent = this;
    while (parent.parentNode.tagName !== 'HTML') {
        let count = 1;
        let previous = parent;
        while (previous.previousElementSibling !== null) {
            count++;
            previous = previous.previousElementSibling;
        }
        uniqueSelector = `>:nth-child(${count})` + uniqueSelector;
        parent = parent.parentNode;
    }
    uniqueSelector = parent.tagName + uniqueSelector;
    return uniqueSelector;
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
const UNIQUE_CLASS_NAME_PREFIX = '--is-ucn-';
const CLASS_NAME = '--inline-script';
var inlineScriptUCN = 0;
const replaceList = {
    '\\&gt;': '>',
    '\\&lt;': '<',
};
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
                    evalCode += 'let parent=document.querySelector("' + element.getUniqueSelector() + '");';
                    evalCode += 'let scope=parent;';
                    evalCode += 'let state={render(){Array.from(parent.children).forEach(_=>_.render())}};';
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
    return true;
}
function handleInlineScriptEvalResultHTMLElement(element, result) {
    if (!(result instanceof HTMLElement))
        return;
    element.append(result);
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
function handleInlineScriptEvalResult(element, result) {
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
        console.log(this.reactiveElements);
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
        element.render = function () {
            if (element.static)
                return;
            if (element.hasInlineScript()) {
                try {
                    element.innerHTML = '';
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
    }
    getFirstAttributeName(element) {
        const attributes = element.attributes;
        if (attributes.length === 0)
            return '';
        return attributes[0].name;
    }
    compileTagName(element) {
        if (this.isMacro(element))
            return this.compileMacro(element);
        if (this.isFunction(element))
            return this.compileFunction(element);
    }
    isMacro(element) {
        return element.tagName === 'define';
    }
    compileMacro(element) { }
    isFunction(element) {
        return element.tagName === 'function';
    }
    compileFunction(element) { }
    hasInlineScript(element) {
        return element.hasInlineScript() || element.hasInlineScriptAttributes();
    }
    setUniqueClassName(element) {
        if (element.classList.contains(CLASS_NAME))
            return;
        element.ucn = inlineScriptUCN++;
        element.classList.add(UNIQUE_CLASS_NAME_PREFIX + element.ucn);
    }
    setClassName(element) {
        element.classList.add(CLASS_NAME);
    }
    compile(element) {
        this.compileAttributes(element);
        this.compileTagName(element);
        this.compileInlineScript(element);
    }
    setup(element) {
        if (!this.hasInlineScript(element))
            return;
        this.setUniqueClassName(element);
        this.setClassName(element);
        this.setRenderFunction(element);
    }
    handle(element) {
        this.handleAttributes(element);
    }
    scan(element, recursive = true) {
        this.compile(element);
        this.setup(element);
        element.render();
        this.handle(element);
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
}

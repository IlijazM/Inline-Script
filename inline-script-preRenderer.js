var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var preRenderInlineScript;
var inlineScriptGotPreRendered;
var ISPR = {
    script: '',
    tasks: 0,
    closingScriptTag: '</script>',
    appendScriptToHead(scriptElement) {
        document.head.appendChild(scriptElement);
    },
    createScriptElement(script) {
        const scriptElement = document.createElement('script');
        scriptElement.innerHTML = script;
        return scriptElement;
    },
    createAndAppendScript() {
        const scriptElement = ISPR.createScriptElement(ISPR.script);
        ISPR.appendScriptToHead(scriptElement);
    },
    shouldPreRender() {
        return preRenderInlineScript && !inlineScriptGotPreRendered;
    },
    preRender() {
        if (!ISPR.shouldPreRender())
            return;
        ISPR.script += `var inlineScriptGotPreRendered = true;\n`;
        ISPR.script += `if (compiledInlineScript === false) {\n\n`;
        ISPR.script += `window.addEventListener('load', () => {\n`;
    },
    addInlineScript(element) {
        ISPR.script += 'el.inlineScript = `' + InlineScript.escapeAll(element.inlineScript) + '`;\n';
    },
    addInlineScriptAttributes(element) {
        let attributes = JSON.stringify(element.inlineScriptAttributes);
        attributes = InlineScript.escapeAll(attributes);
        ISPR.script += `el.setInlineScriptAttributes = JSON.parse('${attributes}');\n`;
    },
    addElement(element) {
        if (element.isid === undefined)
            return;
        ISPR.script += `var el = document.querySelector('*[${InlineScript.ISID_ATTRIBUTE_NAME}="${element.isid}"]');\n`;
        if (element.hasInlineScript())
            ISPR.addInlineScript(element);
        if (element.hasInlineScriptAttributes())
            ISPR.addInlineScriptAttributes(element);
    },
    addSrcCache() {
        Object.entries(InlineScript.srcCache).forEach(([src, cache]) => {
            ISPR.script +=
                "InlineScript.srcCache['" +
                    InlineScript.escapeAll(src) +
                    "'] = `" +
                    InlineScript.escapeAll(cache) +
                    '`;\n';
        });
    },
    handleClosingScriptTags() {
        ISPR.script = ISPR.script.replace(/\<\/script\>/gm, '`+ISPR.closingScriptTag+`');
    },
    finish() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ISPR.shouldPreRender())
                return;
            yield ISPR.asyncTasks();
            ISPR.addSrcCache();
            ISPR.handleClosingScriptTags();
            ISPR.script += `inlineScript();})}`;
            ISPR.createAndAppendScript();
            document.body.setAttribute('inline-script-compiler-finished', 'true');
        });
    },
    asyncTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let intervalID = setInterval(() => {
                    if (ISPR.tasks <= 0) {
                        clearInterval(intervalID);
                        intervalID = null;
                        resolve();
                    }
                }, 20);
                setTimeout(() => {
                    if (intervalID !== null) {
                        console.warn('The compiler finished forcefully. There may be asynchronous tasks left.');
                        clearInterval(intervalID);
                        resolve();
                    }
                }, 4000);
            });
        });
    },
};
ISPR.preRender();

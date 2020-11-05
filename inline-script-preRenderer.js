var preRenderInlineScript;
var inlineScriptGotPreRendered;
var ISPR = {
    script: '',
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
        ISPR.script += `var inlineScriptGotPreRendered = true;\n\n`;
        ISPR.script += `if (compiledInlineScript === false) {\n\n`;
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
        ISPR.script += `var el = document.querySelector('.${InlineScript.ISID_ATTRIBUTE_NAME}${element.isid}');\n`;
        if (element.hasInlineScript())
            ISPR.addInlineScript(element);
        if (element.hasInlineScriptAttributes())
            ISPR.addInlineScriptAttributes(element);
    },
    finish() {
        if (!ISPR.shouldPreRender())
            return;
        ISPR.script += `}`;
        ISPR.createAndAppendScript();
    },
};
ISPR.preRender();

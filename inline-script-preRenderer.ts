/**
 * Set this variable to a truthy value before the inline script js file
 * gets loaded in order to pre-render inline script.
 */
var preRenderInlineScript: boolean;

/**
 * If this variable is true the inline script syntax already got rendered
 * so the 'preRenderInlineScript' variable will get ignored and inline
 * script will not get pre rendered twice.
 */
var inlineScriptGotPreRendered: boolean;

/**
 * ISPR: inline script pre renderer.
 */
var ISPR: any = {
  /**
   * The script that will get generated
   */
  script: '',

  /**
   * Appends a script element to the head.
   */
  appendScriptToHead(scriptElement: HTMLScriptElement) {
    document.head.appendChild(scriptElement);
  },

  /**
   * Creates a script element with the content 'script'.
   */
  createScriptElement(script: string): HTMLScriptElement {
    const scriptElement = document.createElement('script') as HTMLScriptElement;
    scriptElement.innerHTML = script;
    return scriptElement;
  },

  /**
   * Creates and appends the script to the head.
   */
  createAndAppendScript() {
    const scriptElement = ISPR.createScriptElement(ISPR.script);
    ISPR.appendScriptToHead(scriptElement);
  },

  /**
   * Returns true if inline script should get pre rendered depending
   * on global variables.
   */
  shouldPreRender(): boolean {
    return preRenderInlineScript && !inlineScriptGotPreRendered;
  },

  /**
   * This will pre-render the inline script function
   */
  preRender() {
    if (!ISPR.shouldPreRender()) return;

    ISPR.script += `var inlineScriptGotPreRendered = true;\n\n`;
    ISPR.script += `if (compiledInlineScript === false) {\n\n`;
  },

  /**
   * Adds inline script of an element to the script.
   */
  addInlineScript(element: HTMLElement) {
    ISPR.script += 'el.inlineScript = `' + InlineScript.escapeAll(element.inlineScript) + '`;\n';
  },

  /**
   * Adds inline script attributes of an element to the script.
   */
  addInlineScriptAttributes(element: HTMLElement) {
    let attributes = JSON.stringify(element.inlineScriptAttributes);
    attributes = InlineScript.escapeAll(attributes);

    ISPR.script += `el.setInlineScriptAttributes = JSON.parse('${attributes}');\n`;
  },

  /**
   * Adds all inline script properties form an element and adds them
   * in a script tag.
   */
  addElement(element: HTMLElement) {
    if (element.isid === undefined) return;

    ISPR.script += `var el = document.querySelector('.${InlineScript.ISID_ATTRIBUTE_NAME}${element.isid}');\n`;
    if (element.hasInlineScript()) ISPR.addInlineScript(element);
    if (element.hasInlineScriptAttributes()) ISPR.addInlineScriptAttributes(element);
  },

  /**
   * Finishes the script and adds it to the head.
   *
   * This function should get called after all elements got scanned and all
   * necessary information got handles from inline script.
   */
  finish() {
    if (!ISPR.shouldPreRender()) return;

    ISPR.script += `}`;
    ISPR.createAndAppendScript();
    document.body.setAttribute('inline-script-compiler-finished', 'true');
  },
};

ISPR.preRender();

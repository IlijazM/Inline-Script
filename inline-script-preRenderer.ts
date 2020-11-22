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
   * Keeps track of asynchronous tasks.
   *
   * When an asynchronous task starts this number should increase by one in an synchronous process.
   * When an asynchronous task resolves or rejects this number should decrease by on in an async process.
   *
   * This results in a complete pre rendering where no asynchronous tasks got ignored.
   */
  tasks: 0,

  /**
   * This variable is necessary because if you would bake a closing script tag in ISPR script the html
   * rendering engine would get confused and closes the script tag earlier than intended.
   */
  closingScriptTag: '</script>',

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

    ISPR.script += `var inlineScriptGotPreRendered = true;\n`;
    ISPR.script += `if (compiledInlineScript === false) {\n\n`;
    ISPR.script += `window.addEventListener('load', () => {\n`;
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

    ISPR.script += `var el = document.querySelector('*[${InlineScript.ISID_ATTRIBUTE_NAME}="${element.isid}"]');\n`;
    if (element.hasInlineScript()) ISPR.addInlineScript(element);
    if (element.hasInlineScriptAttributes()) ISPR.addInlineScriptAttributes(element);
  },

  /**
   * Adds the src cache to the script.
   */
  addSrcCache() {
    Object.entries(InlineScript.srcCache).forEach(([src, cache]) => {
      ISPR.script +=
        "InlineScript.srcCache['" +
        InlineScript.escapeAll(src) +
        "'] = `" +
        InlineScript.escapeAll(cache as string) +
        '`;\n';
    });
  },

  /**
   * Removes all </script> and replaces them with the 'ISPR.closingScriptTag' variable.
   *
   * This is necessary because if you would bake a closing script tag in ISPR script the html
   * rendering engine would get confused and closes the script tag earlier than intended.
   */
  handleClosingScriptTags() {
    ISPR.script = ISPR.script.replace(/\<\/script\>/gm, '`+ISPR.closingScriptTag+`');
  },

  /**
   * Finishes the script and adds it to the head.
   *
   * This function should get called after all elements got scanned and all
   * necessary information got handles from inline script.
   */
  async finish() {
    if (!ISPR.shouldPreRender()) return;

    await ISPR.asyncTasks();

    ISPR.addSrcCache();

    ISPR.handleClosingScriptTags();

    ISPR.script += `inlineScript();})}`;
    ISPR.createAndAppendScript();
    document.body.setAttribute('inline-script-compiler-finished', 'true');
  },

  /**
   * Checks in an interval if all asynchronous tasks got completed and then ends the compiler
   */
  async asyncTasks() {
    return new Promise((resolve, reject) => {
      let intervalID = setInterval(() => {
        if (ISPR.tasks <= 0) {
          clearInterval(intervalID);
          intervalID = null;
          resolve();
        }
      }, 20);

      /**
       * resolve after 4 seconds
       */
      setTimeout(() => {
        if (intervalID !== null) {
          console.warn('The compiler finished forcefully. There may be asynchronous tasks left.');
          clearInterval(intervalID);
          resolve();
        }
      }, 4000);
    });
  },
};

ISPR.preRender();

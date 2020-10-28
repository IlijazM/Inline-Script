//#region HTMLElement prototype

interface HTMLElement {
  render(): void;

  initialContent: { set: (value: string) => void; get: () => string };
  _initialContent: string;

  setInlineScript(value: string): void;
  inlineScript: string;
  hasInlineScript: () => boolean;

  setInlineScriptAttributes(value: Array<NamedNodeMap>): void;
  inlineScriptAttributes: Array<NamedNodeMap>;
  hasInlineScriptAttributes: () => boolean;
}

/**
 * Will render the element's inlineScript, handleBars, attributes, ...
 */
HTMLElement.prototype.render = function () {};

/**
 * The initial innerHTML of an element
 */
HTMLElement.prototype.initialContent = {
  set(value: string) {
    if (this._initialContent === undefined) this._initialContent = value;
  },
  get(): string {
    return this._initialContent;
  },
};

/**
 * The inlineScript
 */
HTMLElement.prototype.setInlineScript = function (value: string) {
  if (this.inlineScript === undefined) this.inlineScript = value;
};

HTMLElement.prototype.hasInlineScript = function () {
  return this.inlineScript !== undefined;
};

/**
 * A list of all attributes including inline script syntax
 */
HTMLElement.prototype.setInlineScriptAttributes = function (value: Array<NamedNodeMap>) {
  if (this.inlineScriptAttributes === undefined) this.inlineScriptAttributes = value;
};

HTMLElement.prototype.hasInlineScriptAttributes = function () {
  return this.inlineScriptAttributes !== undefined;
};
//#endregion

//#region Variables
const UNIQUE_CLASS_NAME_PREFIX = '--is-uid-';
const CLASS_NAME = '--inline-script';
var inlineScriptUniqueId = 0;

const replaceList = {
  '\\&gt;': '>',
  '\\&lt;': '<',
};
//#endregion

//#region Functions

function reverseSanitation(html: string): string {
  for (const [regex, replacement] of Object.entries(replaceList))
    html = html.replace(new RegExp(regex, 'gm'), replacement);

  return html;
}
//#endregion

//#region Handlers
//#region Handle inline script eval result

function handleInlineScriptEvalResultUndefined(result: any): boolean {
  return result === undefined;
}

function handleInlineScriptEvalResultHTMLCollection(element: HTMLElement, result: HTMLCollection): boolean {
  if (!(result instanceof HTMLCollection)) return;
  Array.from(result).forEach((child) => element.append(child));
  return true;
}

function handleInlineScriptEvalResultHTMLElement(element: HTMLElement, result: HTMLElement): boolean {
  if (!(result instanceof HTMLElement)) return;
  element.append(result);
  return true;
}

function isHTMLElementArray(result: Array<any>) {
  return result.every((i) => i instanceof HTMLElement);
}

function handleInlineScriptEvalResultArray(element: HTMLElement, result: Array<any>): boolean {
  if (!(result instanceof Array)) return;
  if (isHTMLElementArray(result)) result.forEach((child: HTMLElement) => element.append(child));
  else element.innerHTML = result.join('');
  return true;
}

function handleInlineScriptEvalResultPromise(element: HTMLElement, result: Promise<any>): boolean {
  if (!(result instanceof Promise)) return;
  result
    .then((res: any) => {
      handleInlineScriptEvalResult(element, res);
    })
    .catch((res) => {
      handleExceptionResult(element, res);
    });
  return true;
}

function handleInlineScriptEvalResult(element: HTMLElement, result: any) {
  element.innerHTML = '';

  if (handleInlineScriptEvalResultUndefined(result)) return;
  if (handleInlineScriptEvalResultHTMLCollection(element, result)) return;
  if (handleInlineScriptEvalResultHTMLElement(element, result)) return;
  if (handleInlineScriptEvalResultArray(element, result)) return;
  if (handleInlineScriptEvalResultPromise(element, result)) return;

  element.innerHTML = result.toString();

  return;
}
//#endregion

function handleExceptionResult(element: HTMLElement, error: any) {
  console.error(error);

  element.style.background = 'red';
  element.style.color = 'yellow';
  element.style.fontSize = '20px';
  element.innerHTML = error;
}
//#endregion

class InlineScript {
  constructor() {}

  //#region Rendering
  setRenderFunction(element: HTMLElement) {
    element.render = function () {
      if (element.hasInlineScript()) {
        try {
          handleInlineScriptEvalResult(element, eval(element.inlineScript));
        } catch (err) {
          handleExceptionResult(element, err);
        }
      }
    };
  }
  //#endregion

  //#region Inline script
  compileInlineScript(element: HTMLElement) {
    if (!this.isInlineScript(element)) return;
    element.setInlineScript(reverseSanitation(element.innerHTML));
  }

  isInlineScript(element: HTMLElement): boolean {
    return element.innerHTML.trim().startsWith('{');
  }
  //#endregion

  //#region Attributes
  compileAttributes(element: HTMLElement) {}

  renderAttributes(element: HTMLElement) {}

  /**
   * Reads the first attribute of an element
   *
   * @returns the first attribute of the element or an empty string
   */
  getFirstAttributeName(element: HTMLElement): string {
    const attributes = element.attributes;
    if (attributes.length === 0) return '';
    return attributes[0].name;
  }
  //#endregion

  //#region Check tagname
  /**
   * @param element html element
   * @returns if the tagname of the element is a special case
   */
  compileTagName(element: HTMLElement) {
    if (this.isMacro(element)) return this.handleMacro(element);
    if (this.isFunction(element)) return this.handleFunction(element);
  }
  //#endregion

  //#region Macros
  isMacro(element: HTMLElement): boolean {
    return element.tagName === 'define';
  }

  handleMacro(element: HTMLElement) {}
  //#endregion

  //#region Functions
  isFunction(element: HTMLElement): boolean {
    return element.tagName === 'function';
  }

  handleFunction(element: HTMLElement) {}
  //#endregion

  //#region General
  hasInlineScript(element: HTMLElement): boolean {
    return element.hasInlineScript() || element.hasInlineScriptAttributes();
  }

  setClassName(element: HTMLElement) {
    element.classList.add(CLASS_NAME);
  }

  setUniqueClassName(element: HTMLElement) {
    element.classList.add(UNIQUE_CLASS_NAME_PREFIX + inlineScriptUniqueId++);
  }

  /**
   * Calls the compiling function on all cases of an element
   */
  compile(element: HTMLElement) {
    this.compileAttributes(element);
    this.compileTagName(element);
    this.compileInlineScript(element);
  }

  /**
   * Sets the rendering function and unique name
   */
  setup(element: HTMLElement) {
    if (!this.hasInlineScript(element)) return;
    this.setClassName(element);
    this.setUniqueClassName(element);
    this.setRenderFunction(element);
  }
  //#endregion

  //#region Scan

  /**
   * Will scan a html element
   *
   * @param element the element that will get scanned
   * @param recursive if true the child elements will get scanned as well
   */
  scan(element: HTMLElement, recursive: boolean = true) {
    this.compile(element);
    this.setup(element);
    element.render();

    if (recursive) this.scanAll(element.children);
  }

  scanAll(elements: HTMLCollection) {
    for (const element of elements) this.scan(element as HTMLElement);
  }
  //#endregion
}

/**
 * Will initiate everything automatically
 */
function inlineScript() {
  const inlineScript = new InlineScript();
  inlineScript.scan(document.body);
}

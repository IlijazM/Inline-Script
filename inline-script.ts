//#region HTMLElement prototype

interface HTMLElement {
  render(): void;

  static: boolean;
  ucn: number; // unique class name

  getUniqueSelector(): string;

  setStatic(): void;

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

HTMLElement.prototype.setStatic = function () {
  this.render = function () {};

  this.inlineScript = undefined;
  this.inlineScriptAttributes = undefined;
};

HTMLElement.prototype.getUniqueSelector = function (): string {
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
const UNIQUE_CLASS_NAME_PREFIX = '--is-ucn-';
const CLASS_NAME = '--inline-script';
var inlineScriptUCN = 0;

const replaceList = {
  '\\&gt;': '>',
  '\\&lt;': '<',
};
//#endregion

//#region Functions

function reverseSanitation(html: string): string {
  for (const [regex, replacement] of (Object as any).entries(replaceList))
    html = html.replace(new RegExp(regex, 'gm'), replacement);

  return html;
}

function escapeAll(string: string): string {
  return string
    .replace(/\\/gm, '\\\\')
    .replace(/\$/gm, '\\$')
    .replace(/'/gm, "\\'")
    .replace(/"/gm, '\\"')
    .replace(/`/gm, '\\`');
}

function createElements(stringElement: string): HTMLCollection {
  const parent = document.createElement('div');
  parent.innerHTML = '<div>' + stringElement + '</div>';
  return (parent.firstChild as HTMLElement).children;
}
//#endregion

//#region HTML Syntax
function compileHTMLSyntax(inlineScript: string, element: HTMLElement): string {
  inlineScript = reverseSanitation(inlineScript);

  let inQuotes = ''; // which quote got opened
  let escapeQuotes = false; // if there is a escape character for quotes
  let htmlExpressionDepth = 0; // the depth of the html expression

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
    } else if (c === inQuotes && escapeQuotes === false) {
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

function handleInlineScriptEvalResultArray(element: HTMLElement, result: Array<any>): boolean {
  if (!(result instanceof Array)) return;
  result.forEach((child: any) => {
    handleInlineScriptEvalResult(element, child);
  });
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
  if (handleInlineScriptEvalResultUndefined(result)) return;
  if (handleInlineScriptEvalResultHTMLCollection(element, result)) return;
  if (handleInlineScriptEvalResultHTMLElement(element, result)) return;
  if (handleInlineScriptEvalResultArray(element, result)) return;
  if (handleInlineScriptEvalResultPromise(element, result)) return;

  element.innerHTML += result.toString();

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
  constructor() {
    this.setupReaction();
  }

  //#region Reaction
  reactiveElements: Record<string, Array<HTMLElement>> = {};
  oldValues: Record<string, any> = {};

  setupReaction() {
    setInterval(() => {
      this.reaction();
    }, 50);
  }

  reaction() {
    console.log(this.reactiveElements);
    for (const [varName, reactiveElements] of (Object as any).entries(this.reactiveElements)) {
      const varValue = eval(varName);

      if (this.oldValues[varName] !== varValue) {
        this.oldValues[varName] = varValue;

        for (const reactiveElement of reactiveElements) {
          function remove() {
            reactiveElements[varName] = reactiveElements.filter((element: HTMLElement) => element === reactiveElement);
          }

          if (reactiveElement.parentElement === null) remove();

          try {
            reactiveElement.render();
          } catch (err) {
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

  addReaction(element: HTMLElement) {
    const varName = element.getAttribute('reacts');

    if (this.reactiveElements[varName] === undefined) this.reactiveElements[varName] = [];
    this.reactiveElements[varName].push(element);
  }

  hasReaction(element: HTMLElement): boolean {
    return element.hasAttribute('reacts');
  }
  //#endregion

  //#region Rendering
  setRenderFunction(element: HTMLElement) {
    element.render = function () {
      if (element.static) return;
      if (element.hasInlineScript()) {
        try {
          element.innerHTML = '';
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
    element.setInlineScript(compileHTMLSyntax(element.innerHTML, element));
  }

  isInlineScript(element: HTMLElement): boolean {
    return element.innerHTML.trim().startsWith('{');
  }
  //#endregion

  //#region Attributes
  compileAttributes(element: HTMLElement) {}

  renderAttributes(element: HTMLElement) {}

  handleAttributes(element: HTMLElement) {
    element.hasAttribute('static') && element.setStatic();
    this.hasReaction(element) && this.addReaction(element);
  }
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
    if (this.isMacro(element)) return this.compileMacro(element);
    if (this.isFunction(element)) return this.compileFunction(element);
  }
  //#endregion

  //#region Macros
  isMacro(element: HTMLElement): boolean {
    return element.tagName === 'define';
  }

  compileMacro(element: HTMLElement) {}
  //#endregion

  //#region Functions
  isFunction(element: HTMLElement): boolean {
    return element.tagName === 'function';
  }

  compileFunction(element: HTMLElement) {}
  //#endregion

  //#region General
  hasInlineScript(element: HTMLElement): boolean {
    return element.hasInlineScript() || element.hasInlineScriptAttributes();
  }

  setUniqueClassName(element: HTMLElement) {
    if (element.classList.contains(CLASS_NAME)) return;
    element.ucn = inlineScriptUCN++;
    element.classList.add(UNIQUE_CLASS_NAME_PREFIX + element.ucn);
  }

  setClassName(element: HTMLElement) {
    element.classList.add(CLASS_NAME);
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
    this.setUniqueClassName(element);
    this.setClassName(element);
    this.setRenderFunction(element);
  }

  /**
   * Will handle additional attributes after the element got rendered
   */
  handle(element: HTMLElement) {
    this.handleAttributes(element);
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

    this.handle(element);

    if (recursive && !element.hasInlineScript()) this.scanAll(element.children);
  }

  scanAll(elements: HTMLCollection) {
    for (const element of elements) this.scan(element as HTMLElement);
  }
  //#endregion

  //#region From string
  fromString(stringElement: string) {
    const elements = createElements(stringElement);
    for (const element of elements) this.scan(element as HTMLElement);
    return elements;
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

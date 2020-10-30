//#region HTMLElement prototype

interface HTMLElement {
  render(): void;

  static: boolean;

  /**
   * ucn = Unique Class Name
   */
  setUcn(): void;
  removeUcn(): void;
  ucn: number;

  setStatic(): void;

  inlineScriptSrc: string; // The content of the src attribute

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
 * 
  setUniqueClassName(element: HTMLElement) {
    if (element.classList.contains(CLASS_NAME)) return;
    element.ucn = inlineScriptUCN++;
    element.classList.add(UNIQUE_CLASS_NAME_PREFIX + element.ucn);
  }

  setClassName(element: HTMLElement) {
    element.classList.add(CLASS_NAME);
  }
 */

HTMLElement.prototype.setUcn = function () {
  if (this.classList.contains(CLASS_NAME)) return;
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

  this.render = function () {};
  this.removeUcn();

  this.inlineScript = undefined;
  this.inlineScriptAttributes = undefined;
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
  if (this.inlineScript !== undefined) return;

  this.inlineScript = value;
};

HTMLElement.prototype.hasInlineScript = function () {
  return this.inlineScript !== undefined;
};

/**
 * A list of all attributes including inline script syntax
 */
HTMLElement.prototype.setInlineScriptAttributes = function (value: Array<NamedNodeMap>) {
  if (this.inlineScriptAttributes !== undefined) return;

  this.inlineScriptAttributes = value;
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

const tagNamesUsingSrc = ['AUDIO', 'EMBED', 'IFRAME', 'IMG', 'INPUT', 'SCRIPT', 'SOURCE', 'TRACK', 'VIDEO'];
const ignoredTagNameList = ['SCRIPT', 'STYLE', 'LINK', 'META'];

let srcCache = {};
//#endregion

//#region Functions

//#region Load content
function load(element: HTMLElement, url: string): void {
  element.inlineScriptSrc = url;
  element.render();
}

async function loadFromUrl(url: string): Promise<string> {
  let res: string;

  if (srcCache[url] === undefined) res = await (await fetch(url)).text();
  else res = srcCache[url];
  srcCache[url] = res;

  return res;
}
//#endregion

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

//#region Scoped CSS
const CSSCommentsRegex = /\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/g;
function removeAllCssComments(css: string): string {
  return css.replace(CSSCommentsRegex, '');
}

function scope(scope: string, css: string) {
  css = removeAllCssComments(css);

  const regex = /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g;
  let m: RegExpMatchArray;

  while ((m = regex.exec(css)) !== null) {
    if (m.index === regex.lastIndex) regex.lastIndex++;

    let match = m[0].trim();
    const index = m.index;

    if (
      !match.startsWith('@') &&
      !match.startsWith('from') &&
      !match.startsWith('to') &&
      !/[\d]/.test(match.substr(0, 1))
    ) {
      let end = css.substr(index).trim();
      if (end.startsWith('#this')) end = end.substr(6);
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

function getScopedStyleElements(parent: HTMLElement): Array<HTMLElement> {
  return Array.from(parent.querySelectorAll('style[scoped]'));
}

function scopeStyle(element: HTMLElement) {
  const uniqueStyleClassName = getUniqueStyleClassName();
  // sets a unique class name to the element's parent
  element.parentElement.classList.add(uniqueStyleClassName);

  element.innerHTML = scope('.' + uniqueStyleClassName, element.innerHTML);
  element.removeAttribute('scoped');
}

function scopeStyles(parent: HTMLElement) {
  let styles = getScopedStyleElements(parent);

  styles.forEach(scopeStyle);

  styles = Array.from(parent.querySelectorAll('style[scope]'));
}

function scopeAllStyles() {
  scopeStyles(document.querySelector('html'));
}
//#endregion

//#region HTML Syntax
function generateEvalPreCode(element: HTMLElement): string {
  let evalCode = '';
  evalCode += 'let parent=document.querySelector(".' + UNIQUE_CLASS_NAME_PREFIX + element.ucn + '");';
  evalCode += 'let scope=parent;';
  evalCode += 'let state={render(){Array.from(parent.children).forEach(_=>_.render())}};';
  return evalCode;
}

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
//#endregion

//#region Handlers
//#region Handle inline script eval result

function handleInlineScriptEvalResultUndefined(result: any): boolean {
  return result === undefined;
}

function handleInlineScriptEvalResultHTMLCollection(element: HTMLElement, result: HTMLCollection): boolean {
  if (!(result instanceof HTMLCollection)) return;
  Array.from(result).forEach((child) => element.append(child));
  scopeStyles(element);
  return true;
}

function handleInlineScriptEvalResultHTMLElement(element: HTMLElement, result: HTMLElement): boolean {
  if (!(result instanceof HTMLElement)) return;
  element.append(result);
  scopeStyles(element);
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

function handleInlineScriptEvalResult(element: HTMLElement, result: any, clear: boolean = false) {
  if (clear) element.innerHTML = '';

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
    const that = this;
    element.render = function () {
      if (element.static) return;
      if (element.hasInlineScript()) {
        try {
          handleInlineScriptEvalResult(element, eval(element.inlineScript), true);
        } catch (err) {
          handleExceptionResult(element, err);
        }
      }
      if (element.inlineScriptSrc !== undefined) {
        loadFromUrl(element.inlineScriptSrc).then(async (content: string) => {
          handleInlineScriptEvalResult(
            element,
            eval(InlineScript + generateEvalPreCode(element) + 'new InlineScript().fromString(`' + content + '`);'),
            true
          );
        });
        /**
         * let evalCode = '';
          evalCode += 'eval(InlineScript+`';
          evalCode += 'let parent=document.querySelector("' + element.getUniqueSelector() + '");';
          evalCode += 'let scope=parent;';
          evalCode += 'let state={render(){Array.from(parent.children).forEach(_=>_.render())}};';
          evalCode += 'new InlineScript().fromString(\\`<';
         */
      }
    };
  }
  //#endregion

  //#region Inline script
  compileInlineScript(element: HTMLElement) {
    if (!this.isInlineScript(element)) return;
    element.setUcn();
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
    this.hasValidSrcAttribute(element) && this.handleSrcAttribute(element);
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

  //#region Src attribute
  /**
   * Checks if the element has a src attribute and ignores tag names that
   * already use this attribute for other purposes.
   */
  hasValidSrcAttribute(element: HTMLElement): boolean {
    return element.hasAttribute('src') && !tagNamesUsingSrc.includes(element.tagName);
  }

  handleSrcAttribute(element: HTMLElement) {
    const src = element.getAttribute('src');
    element.inlineScriptSrc = src;
  }
  //#endregion

  //#region Tag names

  //#region Check tagname
  /**
   * Filters all tagNames that inlineScript should ignore e.g. script, style, ...
   */
  ignoreDueToTagName(element: HTMLElement): boolean {
    return ignoredTagNameList.includes(element.tagName);
  }

  /**
   * Checks the tagName of an element and handles it.
   *
   * @returns true, if the scan process should stop
   */
  checkTagName(element: HTMLElement): boolean {
    if (this.ignoreDueToTagName(element)) return true;
    if (this.isMacro(element)) return this.compileMacro(element);
    if (this.isFunction(element)) return this.compileFunction(element);
    if (this.isPreLoad(element)) return this.preLoad(element);
  }
  //#endregion

  //#region Macros
  isMacro(element: HTMLElement): boolean {
    return element.tagName === 'DEFINE';
  }

  compileMacro(element: HTMLElement): boolean {
    return true;
  }
  //#endregion

  //#region Functions
  isFunction(element: HTMLElement): boolean {
    return element.tagName === 'FUNCTION';
  }

  compileFunction(element: HTMLElement): boolean {
    return true;
  }
  //#endregion

  //#region Preload
  isPreLoad(element: HTMLElement): boolean {
    return element.tagName === 'PRELOAD';
  }

  preLoad(element: HTMLElement): boolean {
    if (!element.hasAttribute('src')) return true;

    const src = element.getAttribute('src');
    loadFromUrl(src);

    element.style.display = 'none';

    return true;
  }
  //#endregion
  //#endregion

  //#region Scan
  /**
   * Will scan a html element
   *
   * @param element the element that will get scanned
   * @param recursive if true the child elements will get scanned as well
   */
  scan(element: HTMLElement, recursive: boolean = true) {
    if (this.checkTagName(element)) return;

    this.compileAttributes(element);
    this.compileInlineScript(element);
    this.setRenderFunction(element);
    this.handleAttributes(element);

    element.render();

    if (recursive && !element.hasInlineScript()) this.scanAll(element.children);
  }

  /**
   * Runs the scan function on all html elements
   */
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
  scopeAllStyles();
}

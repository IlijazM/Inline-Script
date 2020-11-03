//#region Compatibility
//#region Prototypes
//#region Object.entries
interface Object {
  entries(obj: Record<string, any>): Array<[string, any]>;
}

if (!Object.entries) {
  Object.entries = function (obj: Record<string, any>): Array<[string, any]> {
    let ownProps = Object.keys(obj),
      i = ownProps.length,
      resArray = new Array(i); // preallocate the Array
    while (i--) resArray[i] = [ownProps[i], obj[ownProps[i]]];

    return resArray;
  };
}
//#endregion
//#region Array.from
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function (searchElement: any, fromIndex: number): boolean {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        // c. Increase k by 1.
        k++;
      }

      // 8. Return false
      return false;
    },
  });
}
//#endregion
//#endregion
//#endregion
//#region HTMLElement prototype
//#region Interface without definition
interface HTMLElement {
  /**
   * This function will render the element.
   * See InlineScriptInstance.setRenderFunction to have a look at the rendering process.
   *
   * @param calledAutomatically if enabled it wont scan itself when it's not having any inline script properties.
   */
  render(calledAutomatically: boolean): void;

  /**
   * When true, rendering the element will do nothing.
   * Additionally, when there is an child element having the dynamic attribute, no variables from.
   * the outer scope will be accessible in that element.
   */
  static: boolean;

  /**
   * If true, rendering the element will search for an 'innerhtml' attribute set the 'innerHTML' of the element.
   * to the value of that attribute.
   *
   * This is useful when the content of the inline script gets used for other purposes, e.g. for an onclick event.
   */
  fixedHTML: boolean;

  /**
   * The content of a 'src' attribute, if the element is valid.
   * See more about valid src attributes at InlineScript.hasValidSrcAttribute.
   */
  inlineScriptSrc: string;
}
//#endregion
//#region Interface with definition
//#region UCN
/**
 * The ucn is a unique class name that every inline script element will get.
 * ucn stands for 'Unique Class Name'.
 */
interface HTMLElement {
  setUcn(): void;
  removeUcn(): void;
  ucn: number;
}

/**
 * Will set a ucn and an identifier that an ucn exists if there is nothing already.
 */
HTMLElement.prototype.setUcn = function () {
  if (this.classList.contains(InlineScript.CLASS_NAME)) return;
  this.classList.add(InlineScript.CLASS_NAME);

  this.ucn = InlineScript.inlineScriptUCN++;
  this.classList.add(InlineScript.UNIQUE_CLASS_NAME_PREFIX + this.ucn);
};

/**
 * Removes the ucn and the identifier that an ucn exists.
 */
HTMLElement.prototype.removeUcn = function () {
  this.classList.remove(InlineScript.CLASS_NAME);
  this.classList.remove(InlineScript.UNIQUE_CLASS_NAME_PREFIX + this.ucn);
};
//#endregion
//#region Inline script
/**
 * This stores the initial content (innerHTML) of an element.
 * This is important because the rendering process will overwrite the 'innerHTML' of an element.
 */
interface HTMLElement {
  setInlineScript(value: string): void;
  inlineScript: string;
  hasInlineScript: () => boolean;
}

/**
 * Sets the inline script if it is undefined.
 *
 * @param value the inline script of an element.
 */
HTMLElement.prototype.setInlineScript = function (value: string) {
  if (this.inlineScript === undefined) this.inlineScript = value;
};

/**
 * @returns true if the inline script of an element is not undefined.
 */
HTMLElement.prototype.hasInlineScript = function () {
  return this.inlineScript !== undefined;
};
//#endregion
//#region Inline script attributes
/**
 * This stores an array of attributes of an element that uses the inline script syntax.
 */
interface HTMLElement {
  setInlineScriptAttributes(value: Array<Attr>): void;
  inlineScriptAttributes: Array<Attr>;
  hasInlineScriptAttributes: () => boolean;
}

/**
 * This will set the inline script attributes if it is undefined.
 *
 * @param value the array of inline script attributes of an element.
 */
HTMLElement.prototype.setInlineScriptAttributes = function (value: Array<Attr>) {
  if (this.inlineScriptAttributes !== undefined) return;

  this.inlineScriptAttributes = value;
};

/**
 * @returns true if there are any inline script attributes.
 */
HTMLElement.prototype.hasInlineScriptAttributes = function () {
  return this.inlineScriptAttributes !== undefined && this.inlineScriptAttributes.length > 0;
};
//#endregion
//#region Function
/**
 * Contains the name of the function if the element calls an existing one.
 */
interface HTMLElement {
  functionName: string;
  callsFunction(): boolean;
}

HTMLElement.prototype.callsFunction = function (): boolean {
  return this.functionName !== undefined;
};
//#endregion
//#endregion
//#endregion
//#region Interfaces
/**
 * It contains result of an lexing process.
 */
interface LexingResult {
  index: number;
  length: number;
  content: string;
}
//#endregion
//#region Global functions and variables
/**
 * Loads another html file / cache entry and sets the result to the element 'this'.
 *
 * This function can be used inside the inline script syntax to dynamically load a html file.
 * If you don't want to set the content of the current element but rather the content of another
 * element consider using the following syntax: 'load.call(other, url);'
 *
 * @param url the url of the file / cache.
 * @param forceFetch this will make sure that no cached value will get loaded.
 */
const load = (url: string, forceFetch: boolean = false): void => {
  if (forceFetch) InlineScript.removeFromCache(url);

  this.inlineScriptSrc = url;
  this.render(true);
};

/**
 * Will initiate everything automatically
 */
function inlineScript() {
  const inlineScript = new InlineScriptInstance();
  [document.head, document.body].forEach((element) => inlineScript.scan(element));
  ScopedCss.scopeAllStyles();
}

/**
 * Imitating the state variable.
 */
const state = {
  render() {
    Array.from(document.body.children).forEach((element: any) => {
      if (element.render !== undefined) element.render();
    });
  },
};
//#endregion
//#region CSS
/**
 * This will add some additional css rules that are necessary for inline script to behave properly.
 */
const inlineScriptCss = document.createElement('style');
document.head.appendChild(inlineScriptCss);
inlineScriptCss.innerHTML += `function, preload { display: none !important; }`;

//#region Scoped CSS
const ScopedCss = {
  //#region Class names
  /**
   * This is the prefix of unique class names for scoped css.
   */
  SCOPED_CSS_PREFIX: 'scoped-css-id-',

  /**
   * The counter for unique scoped css class names.
   * This variable will increase by one every time a new class name gets generated.
   */
  scopedCSSId: 0,
  //#endregion

  /**
   * A regex that is used the remove all comments in a css file.
   */
  cssCommentsRegex: /\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/gm,

  /**
   * This will remove all comments in a css.
   *
   * @param css the css as string with comments.
   * @returns the inputted css without comments.
   */
  removeAllCssComments(css: string): string {
    return css.replace(ScopedCss.cssCommentsRegex, '');
  },

  /**
   * Scopes the css.
   *
   * When a selector starts with '#this', it will get replaced by the scope.
   *
   * @param scope the scope that will get appended before every selector.
   * @param css the css that will get scoped.
   *
   * @returns the css inputted but scoped.
   */
  scope(scope: string, css: string): string {
    css = this.removeAllCssComments(css);

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
  },

  /**
   * @returns a unique class name for scoping css
   */
  getUniqueStyleClassName() {
    return ScopedCss.SCOPED_CSS_PREFIX + ScopedCss.scopedCSSId++;
  },

  /**
   * This will query all style elements with a scoped attribute over an element.
   *
   * @returns an array of elements that matches the query.
   */
  getScopedStyleElements(parent: HTMLElement): Array<HTMLElement> {
    return Array.from(parent.querySelectorAll('style[scoped]'));
  },

  /**
   * This will execute everything necessary in order to scope an style element.
   *
   * @param element the style element.
   */
  scopeStyle(element: HTMLElement) {
    const uniqueStyleClassName = this.getUniqueStyleClassName();

    // sets a unique class name to the element's parent
    element.parentElement.classList.add(uniqueStyleClassName);

    element.innerHTML = this.scope('.' + uniqueStyleClassName, element.innerHTML);
    element.removeAttribute('scoped');
  },

  /**
   * This will search for scoped style tags on the element 'parent' and automatically scope them.
   */
  scopeStyles(parent: HTMLElement) {
    let styles = this.getScopedStyleElements(parent);

    styles.forEach(this.scopeStyle);

    styles = Array.from(parent.querySelectorAll('style[scope]'));
  },

  /**
   * Calls the 'scopedStyles' function with the html element as parameter.
   */
  scopeAllStyles() {
    this.scopeStyles(document.querySelector('html'));
  },
};
//#endregion
//#endregion
//#region Inline script
/**
 * This is an object containing global variables and function.
 * The reason these variables and functions are not included in the inlineScriptInstance class is simply
 * that in order for inlineScript to use variables and create a new scope for them, it must re-instantiate
 * the whole class every time when e.g. an html object gets returned from an inline script syntax.
 * So to keep the class as little as possible is key to improve performance.
 */
const InlineScript = {
  //#region Common functions
  /**
   * This is a list of regex that define which parts of html (as string) should be reverse sanitized.
   * Every regex gets the attributes 'global' and 'multiline'.
   */
  reverseSanitationReplaceList: {
    '\\&gt;': '>',
    '\\&lt;': '<',
  },

  /**
   * Reverses the sanitation of an element.
   *
   * @param html the 'innerHTML' or content of an element.
   * @returns the content of an element reversed sanitized.
   */
  reverseSanitation(html: string): string {
    for (const [regex, replacement] of Object.entries(InlineScript.reverseSanitationReplaceList))
      html = html.replace(new RegExp(regex, 'gm'), replacement);

    return html;
  },

  /**
   * Escapes all special characters from a string.
   *
   * @param string the unescaped string.
   * @returns the script inputted but escaped.
   */
  escapeAll(string: string): string {
    return string
      .replace(/\\/gm, '\\\\')
      .replace(/\$/gm, '\\$')
      .replace(/'/gm, "\\'")
      .replace(/"/gm, '\\"')
      .replace(/`/gm, '\\`');
  },

  /**
   * Takes a string and return an collection of html elements.
   *
   * @param stringElement a string with valid html syntax
   * @returns a collection of all elements in the string as HTMLCollection
   */
  createElements(stringElement: string): HTMLCollection {
    const parent = document.createElement('div');
    parent.innerHTML = '<div>' + stringElement + '</div>';
    return (parent.firstChild as HTMLElement).children;
  },

  /**
   * Converts a NamedNodeMap to an object.
   *
   * @returns an object of the attributes in 'element'.
   */
  getAttributesFromElementsAsArray(element: HTMLElement): Record<string, string> {
    return Object.entries(
      Array.from(element.attributes).map((attribute: Attr) => [attribute.name, attribute.value])
    ) as any;
  },

  /**
   * Does the same as 'String.prototype.substr' but throws an error when the output string is empty.
   *
   * @returns the substring of a string.
   */
  substringThrow(string: string, start: number, length: number = undefined): string {
    const res = string.substr(start, length);
    if (res === '') throw 'substring is out of bounce.';
    return res;
  },

  /**
   * Will initiate a new instance of InlineScript and call the scan function on the element
   *
   * This is useful if you have variables in your scope that you want to get rid of.
   *
   * @param element the element that will get scanned in a new instance of InlineScript
   */
  newInlineScript(element: HTMLElement) {
    new InlineScriptInstance().scan(element);
  },
  //#endregion
  //#region Fetching and caching
  /**
   * Stores cached fetch request.
   */
  srcCache: {},

  /**
   * This will fetch an url and caches it in the variable 'srcCache'.
   * If the request already got cached it will return the cache.
   *
   * @param url the url / path.
   * @param forceFetch if set true, it won't return the cache but rather fetch the file again.
   *
   * @returns a promise of the content of the request as string.
   */
  async loadFromUrl(url: string, forceFetch: boolean = false): Promise<string> {
    let res: string;

    if (InlineScript.srcCache[url] === undefined || forceFetch) res = await (await fetch(url)).text();
    else res = InlineScript.srcCache[url];
    InlineScript.srcCache[url] = res;

    return res;
  },

  /**
   * Removes an entry in the 'srcCache'.
   *
   * @param url the url that got cached.
   */
  removeFromCache(url: string) {
    InlineScript.srcCache[url] = undefined;
  },
  //#endregion
  //#region Class names
  /**
   * This is the prefix of unique class names (ucn) for inline script.
   */
  UNIQUE_CLASS_NAME_PREFIX: '--is-ucn-',

  /**
   * The counter for unique inline script class names.
   * This variable will increase by one every time a new class name gets generated.
   */
  inlineScriptUCN: 0,

  /**
   * This is the class name for elements that uses inline script syntax.
   */
  CLASS_NAME: '--inline-script',
  //#endregion
  //#region HTML Syntax
  /**
   * will generate some additional javascript code that should get executed before a new instance
   * of the 'InlineScriptInstance' gets created in a new scope.
   *
   * @param parentElement the parent element
   */

  /**
   * Inserts the lexing result into the string
   *
   * @param string the initial string
   * @param lexingResult the result of the lexing process. Note that the content of the lexing result is used.
   *
   * @returns the string with the content of the result inserted.
   */
  insertLexingResult(string: string, lexingResult: LexingResult): string {
    return (
      string.substr(0, lexingResult.index) +
      lexingResult.content +
      string.substr(lexingResult.index + lexingResult.length)
    );
  },

  /**
   * @returns default eval code that all eval calls to create new InlineScriptInstances use.
   */
  generateEvalPreCode(parentElement: HTMLElement): string {
    let evalCode = '';
    evalCode +=
      'let parent=document.querySelector(".' + InlineScript.UNIQUE_CLASS_NAME_PREFIX + parentElement.ucn + '");';
    evalCode += 'let scope=parent,__parent=parent;';
    evalCode += 'let state={render(){Array.from(parent.children).forEach(_=>_.render())}};';
    return evalCode;
  },

  /**
   * Removes spaces and new lines from a string.
   */
  removeEmptySpace(string: string): string {
    return string.replace(/\n|\s/gm, '');
  },

  /**
   * Converts the LexingResult's content for html syntax.
   */
  convertHTMLSyntaxResultContent(content: string, element: HTMLElement): string {
    return (
      'eval(InlineScriptInstance+`' +
      InlineScript.generateEvalPreCode(element) +
      'new InlineScriptInstance().fromString(\\`' +
      content.substring(1, content.length - 1) +
      '\\`)`)'
    );
  },

  /**
   * Finds a html syntax and returns the index, length and content of it.
   *
   * @param string the html that gets lexed.
   * @param startIndex the index the scanner starts.
   *
   * @returns the start, length and content of the lexed result.
   */
  scanHTMLSyntax(string: string, startIndex: number): LexingResult {
    let result: LexingResult = {
      index: null,
      length: null,
      content: null,
    };

    try {
      let depth = 0;

      for (let i = startIndex; i < string.length; i++) {
        const c = InlineScript.substringThrow(string, i, 1);
        const cc = InlineScript.substringThrow(string, i, 2);

        /**
         * Handle quotes
         */
        if (['"', "'", '¸'].includes(c)) {
          const quote = c;
          i++;
          while (
            InlineScript.substringThrow(string, i, 1) !== quote ||
            InlineScript.substringThrow(string, i - 1, 1) === '\\'
          )
            i++;
        }

        /**
         * Handle comments
         */
        if (cc === '//') while (InlineScript.substringThrow(string, i, 1) !== '\n') i++;
        if (InlineScript.substringThrow(string, i, 4) === '<!--')
          while (InlineScript.substringThrow(string, i, 1) !== '\n') i++;
        if (cc === '/*') while (InlineScript.substringThrow(string, i, 2) !== '*/') i++;

        /**
         * Find opening bracket
         */
        while (InlineScript.substringThrow(string, i, 1) === '(') {
          const bracketIndex = i;
          i++;
          while (/\s|\r/.test(InlineScript.substringThrow(string, i, 1))) i++;
          if (InlineScript.substringThrow(string, i, 1) === '<') {
            depth++;
            if (depth === 1) result.index = bracketIndex;
          }
        }

        /**
         * Find closing bracket
         */
        while (InlineScript.substringThrow(string, i, 1) === '>' && depth > 0) {
          i++;
          while (/\s|\r/.test(InlineScript.substringThrow(string, i, 1))) i++;
          if (InlineScript.substringThrow(string, i, 1) === ')') {
            depth--;
            if (depth === 0) {
              result.length = i + 1 - result.index;
              result.content = string.substr(result.index, result.length);
              result.content = InlineScript.escapeAll(InlineScript.escapeAll(result.content));
              return result;
            }
          }
        }
      }
    } catch {}

    return null;
  },
  /**
   * Compiles the html syntax in an inline script code.
   *
   * @param inlineScript the inline script of an element.
   * @param element the element that has the inline script code.
   *
   * @returns the compiled inline script code.
   */
  compileHTMLSyntax(inlineScript: string, element: HTMLElement): string {
    inlineScript = InlineScript.reverseSanitation(inlineScript);

    let lexingResult: LexingResult,
      lastIndex: number = 0;

    while ((lexingResult = InlineScript.scanHTMLSyntax(inlineScript, lastIndex))) {
      lexingResult.content = InlineScript.convertHTMLSyntaxResultContent(lexingResult.content, element);
      inlineScript = InlineScript.insertLexingResult(inlineScript, lexingResult);
      lastIndex = lexingResult.index + lexingResult.content.length;
    }

    return inlineScript;
  },
  //#endregion
  //#region Rendering
  /**
   * @returns if an element generates child-elements.
   */
  generatesChildElements(element: HTMLElement): boolean {
    return element.functionName !== undefined || element.inlineScriptSrc !== undefined;
  },
  //#endregion
  //#region Handlers
  //#region Handle inline script eval result

  evalResultHandler: {
    handleEvalResultUndefined(element: HTMLElement, result: any): boolean {
      return result === undefined;
    },

    handleEvalResultHTMLCollection(element: HTMLElement, result: HTMLCollection): boolean {
      if (!(result instanceof HTMLCollection)) return;
      Array.from(result).forEach((child) => element.append(child));
      ScopedCss.scopeStyles(element);
      return true;
    },

    handleEvalResultHTMLElement(element: HTMLElement, result: HTMLElement): boolean {
      if (!(result instanceof HTMLElement)) return;
      element.append(result);
      ScopedCss.scopeStyles(element);
      return true;
    },

    handleEvalResultArray(element: HTMLElement, result: Array<any>): boolean {
      if (!(result instanceof Array)) return;
      result.forEach((child: any) => {
        this.handleInlineScriptEvalResult(element, child);
      });
      return true;
    },

    handleEvalResultPromise(element: HTMLElement, result: Promise<any>): boolean {
      if (!(result instanceof Promise)) return;
      result
        .then((res: any) => {
          this.handleInlineScriptEvalResult(element, res);
        })
        .catch((res) => {
          this.handleExceptionResult(element, res);
        });
      return true;
    },
  },

  /**
   * Checks the type of the result and applies it on the element.
   *
   * @param element the element that will get the result value.
   * @param result the result which type is unknown.
   * @param clear if the elements innerHTML should get reset automatically.
   */
  handleEvalResult(element: HTMLElement, result: any, clear: boolean = false) {
    if (clear) element.innerHTML = '';

    for (const [functionName, functionValue] of Object.entries(this.evalResultHandler)) {
      if ((functionValue as any)(element, result)) return;
    }

    element.innerHTML += result.toString();

    return;
  },
  //#endregion

  /**
   * @returns the result nicely parsed to string.
   */
  handleResult(result: any): string {
    if (result === undefined) return '';
    if (typeof result === 'string') return result;
    if (typeof result === 'number') return result.toString();
    if (result instanceof Array) return result.join('');
    return JSON.stringify(result);
  },

  /**
   * Handles errors while executing the eval.
   * It will print the error in the console as well as display the error
   * on the element directly.
   */
  handleExceptionResult(element: HTMLElement, error: any) {
    console.error(error);

    element.style.background = 'red';
    element.style.color = 'yellow';
    element.style.fontSize = '20px';
    element.innerHTML = error;
  },
  //#endregion
  //#region Attributes
  //#region General
  /**
   * Searches for attributes that use the inline script syntax and saves them.
   */
  scanAttributes(element: HTMLElement) {
    const attributes = Array.from(element.attributes);

    const inlineScriptAttributes = [];

    attributes.forEach((attribute) => {
      if (attribute.value.trim().startsWith('{')) {
        inlineScriptAttributes.push(attribute);
      }
    });

    element.inlineScriptAttributes = inlineScriptAttributes;
  },

  /**
   * Reads the first attribute of an element
   *
   * @returns the first attribute of the element or an empty string
   */
  getFirstAttributeName(element: HTMLElement): string {
    const attributes = element.attributes;
    if (attributes.length === 0) return '';
    return attributes[0].name;
  },
  //#endregion
  //#region Reaction
  /**
   * @returns if the element has the 'reacts' attribute.
   */
  hasReaction(element: HTMLElement): boolean {
    return element.hasAttribute('reacts');
  },
  //#endregion
  //#region Src attribute
  /**
   * @returns if the element's tag name uses a 'src' tag by html standards.
   */
  tagNameUsesSrcAttribute(element: HTMLElement): boolean {
    return InlineScript.tagNamesUsingSrcAttribute.includes(element.tagName);
  },

  /**
   * Checks if the element has a src attribute and ignores tag names that
   * already use this attribute for other purposes.
   */
  hasValidSrcAttribute(element: HTMLElement): boolean {
    return element.hasAttribute('src') && !InlineScript.tagNameUsesSrcAttribute(element);
  },

  /**
   * Sets the property 'inlineScriptSrc' on the element,
   */
  handleSrcAttribute(element: HTMLElement) {
    const src = element.getAttribute('src');
    element.inlineScriptSrc = src;
  },
  //#endregion
  //#region Event attribute
  /**
   * @returns true if the element has an event attribute.
   * Event attributes are e.g.: 'onclick', 'onmousedown', ...
   */
  hasEventAttribute(element: HTMLElement): boolean {
    return Array.from(element.attributes).findIndex((attribute) => attribute.name.startsWith('on')) !== -1;
  },
  //#endregion
  //#region Inner html attribute
  /**
   * @returns true if the element has an 'innerhtml' attribute.
   */
  hasInnerHTMLAttribute(element: HTMLElement): boolean {
    return element.hasAttribute('innerhtml');
  },

  /**
   * Will set the inner html of the object to the innerhtml attribute or an empty string.
   */
  handleInnerHTMLAttribute(element: HTMLElement) {
    if (this.hasInnerHTMLAttribute(element)) element.innerHTML = element.getAttribute('innerhtml');
    else element.innerHTML = '';
  },
  //#endregion
  //#endregion
  //#region Inline script
  /**
   * @returns if an elements has a valid inline script syntax.
   */
  hasInlineScript(element: HTMLElement): boolean {
    return element.innerHTML.trim().startsWith('{');
  },

  /**
   * Checks if the element has a valid inline script syntax and then apply all necessary configurations
   * on the element.
   */
  checksInlineScript(element: HTMLElement) {
    if (!InlineScript.hasInlineScript(element)) return;
    element.setUcn();
    element.setInlineScript(InlineScript.compileHTMLSyntax(element.innerHTML, element));
  },
  //#endregion
  //#region Scan
  //#region Tag name
  //#region Function
  /**
   * Keeps track of all the function defined.
   */
  functions: {},

  /**
   * @returns true if the tagName of the element if 'function'
   */
  isFunction(element: HTMLElement): boolean {
    return element.tagName === 'FUNCTION';
  },

  /**
   * Pushes a function from the element in functions array.
   */
  compileFunction(element: HTMLElement): boolean {
    if (element.attributes.length < 1) return true;
    const name = element.attributes[0].name;

    InlineScript.functions[name.toUpperCase()] = element.innerHTML;

    return true;
  },

  /**
   * @returns true if the element is calling a function.
   */
  callsFunction(element: HTMLElement): boolean {
    return Object.keys(InlineScript.functions).includes(element.tagName);
  },

  /**
   * Sets everything necessary for the element to be identified to call a function.
   */
  handleCallsFunction(element: HTMLElement): any {
    element.functionName = element.tagName;
  },
  //#endregion
  //#region Preload
  /**
   * @returns true if the tagName of the element is 'preload'.
   */
  isPreLoad(element: HTMLElement): boolean {
    return element.tagName === 'PRELOAD';
  },

  /**
   * Pre loads the url in the src attribute of an element.
   */
  preLoad(element: HTMLElement): boolean {
    if (!element.hasAttribute('src')) return true;

    const src = element.getAttribute('src');
    InlineScript.loadFromUrl(src);

    return true;
  },
  //#endregion
  /**
   * Tag names that will get skipped during the scanning process.
   */
  ignoredTagNameList: ['SCRIPT', 'STYLE', 'LINK', 'META'],

  /**
   * Filters all tagNames that inlineScript should ignore e.g. script, style, ...
   */
  ignoreDueToTagName(element: HTMLElement): boolean {
    return InlineScript.ignoredTagNameList.includes(element.tagName);
  },

  /**
   * Scans the tagName of an element and handles it.
   *
   * @returns true, if the scan process should stop.
   */
  scanTagName(element: HTMLElement): boolean {
    if (InlineScript.ignoreDueToTagName(element)) return true;
    if (InlineScript.isFunction(element)) return InlineScript.compileFunction(element);
    if (InlineScript.callsFunction(element)) return InlineScript.handleCallsFunction(element);
    if (InlineScript.isPreLoad(element)) return InlineScript.preLoad(element);
  },
  //#endregion
  //#region General scan
  /**
   * Tells if the scan script should scan the children of an element.
   */
  shouldScanChildren(element: HTMLElement): boolean {
    return !element.hasInlineScript() && element.inlineScriptSrc === undefined;
  },

  /**
   * A list of invalid parents for the script element to get executed using inline script.
   */
  invalidScriptParent: [document.body, document.head],

  /**
   * @returns if an element is a script element and is not a children an invalid parent.
   */
  isValidScriptTag(element: HTMLElement): boolean {
    return element.tagName === 'SCRIPT' && InlineScript.invalidScriptParent.includes(element.parentElement);
  },

  /**
   * Filters from the HTMLCollection all elements that have a valid script tag.
   *
   * @param elements an HTMLCollection of elements that will get filtered.
   *
   * @returns an array of HTMLElements that has a valid script tag.
   */
  filterScripts(elements: HTMLCollection): Array<HTMLElement> {
    const scriptElements = [];
    for (const element of elements)
      InlineScript.isValidScriptTag(element as HTMLElement) && scriptElements.push(element);
    return scriptElements;
  },

  /**
   * @returns true if the element or the parent element has the attribute static.
   */
  isStatic(element: HTMLElement): boolean {
    return element.hasAttribute('static') || element.parentElement?.hasAttribute('static');
  },
  //#endregion
  //#endregion

  /**
   * Tag names that occupy the attribute 'src' by html standards.
   */
  tagNamesUsingSrcAttribute: ['AUDIO', 'EMBED', 'IFRAME', 'IMG', 'INPUT', 'SCRIPT', 'SOURCE', 'TRACK', 'VIDEO'],

  /**
   * The refresh time of the reaction interval in milliseconds
   */
  REACTION_INTERVAL_TIME: 50,
};
//#endregion
//#region Inline script instance
/**
 * This class is a recursively self-containing class.
 * That means that the class will create multiple instances of it self and evaluate it.
 * This is why defining variables in a new scope works.
 */
class InlineScriptInstance {
  //#region Constructor
  /**
   * It will setup the reaction interval.
   */
  constructor() {
    this.setupReaction();
  }
  //#endregion
  //#region Reaction
  reactiveElements: Record<string, Array<HTMLElement>> = {};
  oldValues: Record<string, any> = {};

  /**
   * Sets up an interval that calls the reaction function.
   *
   * This function will get called automatically by the constructor.
   */
  setupReaction() {
    setInterval(() => {
      this.reaction();
    }, InlineScript.REACTION_INTERVAL_TIME);
  }

  /**
   * Checks for variable changes and re-renders all reacting elements.
   */
  reaction() {
    for (const [varName, reactiveElements] of Object.entries(this.reactiveElements)) {
      const varValue = eval(varName);

      if (this.oldValues[varName] !== varValue) {
        this.oldValues[varName] = varValue;

        for (const reactiveElement of reactiveElements) {
          function remove() {
            reactiveElements[varName] = reactiveElements.filter((element: HTMLElement) => element === reactiveElement);
          }

          if (reactiveElement.parentElement === null) remove();

          reactiveElement.render(false);
        }
      }
    }
  }
  //#endregion
  //#region Rendering
  /**
   * Sets up the rendering function
   */
  setRenderFunction(element: HTMLElement) {
    const that = this;

    let newVars: Record<string, any> = {};

    element.render = function (calledAutomatically: boolean = false) {
      /**
       * If the element is static then don't execute the render function.
       */
      if (element.static) return;

      /**
       * Render the attributes.
       */
      element.inlineScriptAttributes.forEach(({ name, value }) => {
        const res = InlineScript.handleResult(eval(value));
        element.setAttribute(name, res);
      });

      /**
       * If the element has a fixed 'innerHTML' then apply that and return
       */
      if (element.fixedHTML) return InlineScript.handleInnerHTMLAttribute(element);

      /**
       * If the element generates child-elements then generate the following variables:
       *
       * innerHTML: the innerHTML after the element gets rendered.
       * args: the attributes of the element as object.
       */
      if (InlineScript.generatesChildElements(element)) {
        /**
         * Sets the innerHTML
         */
        const virtualElement = document.createElement('div');

        try {
          InlineScript.handleEvalResult(virtualElement, eval(element.inlineScript), true);
        } catch (err) {
          InlineScript.handleExceptionResult(virtualElement, err);
        }

        newVars.innerHTML = virtualElement.innerHTML;

        /**
         * Sets the attributes
         */
        newVars.args = InlineScript.getAttributesFromElementsAsArray(this);
      }

      /**
       * If the element calls a function
       */
      if (element.callsFunction()) {
        /**
         * These variables may get used inside the eval function.
         */
        const { innerHTML, args } = newVars;

        element.innerHTML = InlineScript.functions[element.functionName];

        eval(InlineScript.generateEvalPreCode(element) + 'new InlineScriptInstance().scanAll(element.children)');

        return;
      }

      /**
       * If the code has inline script
       */
      if (element.hasInlineScript()) {
        try {
          InlineScript.handleEvalResult(element, eval(element.inlineScript), true);
        } catch (err) {
          InlineScript.handleExceptionResult(element, err);
        }

        return;
      }

      /**
       * If the element contains a valid 'src' attribute.
       */
      if (element.inlineScriptSrc !== undefined) {
        return InlineScript.loadFromUrl(element.inlineScriptSrc).then((content: string) => {
          /**
           * These variables may get used inside the eval function.
           */
          const { innerHTML, args } = newVars;

          InlineScript.handleEvalResult(
            element,
            eval(
              InlineScript.generateEvalPreCode(element) +
                'new InlineScriptInstance().fromString(`' +
                InlineScript.escapeAll(content) +
                '`);'
            ),
            true
          );
        });
      }

      /**
       * If the function got called manually then scan it.
       */
      if (!calledAutomatically) that.scan(element);
    };
  }
  //#endregion
  //#region Attributes
  /**
   * Handles diverse attribute events:
   * - Reactions
   * - Src attributes
   * - Event attributes
   * - Inner html attributes
   *
   * This script is in InlineScriptInstance and not in InlineScript because it need variables
   * that are inside the InlineScriptInstance class as well as it defines functions that should
   * be in the same scope as the render function.
   */
  handleAttributes(element: HTMLElement) {
    if (InlineScript.hasReaction(element)) this.addReaction(element);
    if (InlineScript.hasValidSrcAttribute(element)) InlineScript.handleSrcAttribute(element);
    if (InlineScript.hasEventAttribute(element)) this.handleEventAttributes(element);
    if (InlineScript.hasInnerHTMLAttribute(element)) element.fixedHTML = true;
  }

  /**
   * Adds an element to a reaction list.
   *
   * @param element the element that should react to a variable change.
   */
  addReaction(element: HTMLElement) {
    const varName = element.getAttribute('reacts');

    if (this.reactiveElements[varName] === undefined) this.reactiveElements[varName] = [];
    this.reactiveElements[varName].push(element);
  }

  /**
   * Gets all event attributes and rewrites them using the 'setAttribute' function.
   * This will put the event in a scope so it can use outer variables.
   * If an event is declared but it has no content then the content of the inline script
   * will get executed whenever the event gets called but not automatically.
   * In the scenario you can use the attribute 'innerHTML' to set the content of your element.
   * If you need both to be written in the inline script syntax consider writing:
   *      this.onclick = function() { ... }
   * in the inline script syntax.
   */
  handleEventAttributes(element: HTMLElement) {
    const attributes = Array.from(element.attributes).filter((attribute) => attribute.name.startsWith('on'));

    attributes.forEach((attribute) => {
      let value = attribute.value;
      if (!value) {
        value = element.innerHTML;
        element.fixedHTML = true;
      }

      element.setAttribute(attribute.name, '');
      element[attribute.name] = function (event: Event) {
        eval(value);
      };
    });
  }
  //#endregion
  //#region Scan
  /**
   * Scans a html element.
   *
   * @param element the element that will get scanned.
   * @param recursive if true the child elements will get scanned as well.
   */
  scan(element: HTMLElement, recursive: boolean = true) {
    if (element === undefined) return;

    if (InlineScript.scanTagName(element)) return;

    InlineScript.scanAttributes(element);
    InlineScript.checksInlineScript(element);
    this.setRenderFunction(element);
    this.handleAttributes(element);

    /**
     * If the element should be static then apply the static attribute on the element.
     * This is important because if this element generates child elements they will try
     * to figure out if their parent element (this element) has the static attribute.
     */
    if (InlineScript.isStatic(element)) element.setAttribute('static', 'true');

    /**
     * Render the element and set the argument 'renderedAutomatically' to true so that the
     * element will not scan itself again and overflow the maximum call stack size.
     */
    element.render(true);

    /**
     * If the element is static apply the static property so that the element will not get
     * rendered again.
     */
    if (element.hasAttribute('static')) element.static = true;

    if (recursive && InlineScript.shouldScanChildren(element)) this.scanAll(element.children);
  }

  /**
   * Runs the scan function on all html elements
   */
  scanAll(elements: HTMLCollection) {
    const scriptElements = InlineScript.filterScripts(elements);
    if (scriptElements.length !== 0) {
      const elementsLeft = Array.from(elements).filter((element: HTMLElement) => !scriptElements.includes(element));
      eval(
        scriptElements.map((scriptElement) => scriptElement.innerHTML + ';\n').join('') +
          InlineScriptInstance +
          'new InlineScriptInstance().scanAll(elementsLeft)'
      );
      return;
    }
    for (const element of elements) {
      if (element.hasAttribute('dynamic')) {
        InlineScript.newInlineScript(element as HTMLElement);
      } else {
        this.scan(element as HTMLElement);
      }
    }
  }
  /**
   * Creates elements from a string and scans them.
   *
   * @param stringElement the elements as string.
   */
  fromString(stringElement: string) {
    const elements = InlineScript.createElements(stringElement);
    this.scanAll(elements);
    return elements;
  }
  //#endregion
}
//#endregion

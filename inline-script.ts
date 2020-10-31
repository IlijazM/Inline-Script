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
interface Array<T> {
  includes: any;
}

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

  /**
   * Contains the name of the function if the element defines a function.
   * See more at InlineScript.isFunction.
   */
  functionName: string;
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
  if (this.classList.contains(CLASS_NAME)) return;
  this.classList.add(CLASS_NAME);

  this.ucn = inlineScriptUCN++;
  this.classList.add(UNIQUE_CLASS_NAME_PREFIX + this.ucn);
};

/**
 * Removes the ucn and the identifier that an ucn exists.
 */
HTMLElement.prototype.removeUcn = function () {
  this.classList.remove(CLASS_NAME);
  this.classList.remove(UNIQUE_CLASS_NAME_PREFIX + this.ucn);
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
//#endregion
//#endregion

//#region Global variables
//#region Class names and identifier
/**
 * This is the prefix of unique class names (ucn) for inline script.
 */
const UNIQUE_CLASS_NAME_PREFIX = '--is-ucn-';

/**
 * The counter for unique inline script class names.
 * This variable will increase by one every time a new class name gets generated.
 */
var inlineScriptUCN = 0;

/**
 * This is the class name for elements that uses inline script syntax.
 */
const CLASS_NAME = '--inline-script';

/**
 * This is the prefix of unique class names for scoped css.
 */
const SCOPED_CSS_PREFIX = 'scoped-css-id-';

/**
 * The counter for unique scoped css class names.
 * This variable will increase by one every time a new class name gets generated.
 */
let scopedCSSId = 0;
//#endregion

//#region Regex
/**
 * This is a list of regex that define which parts of html (as string) should be reverse sanitized.
 * Every regex gets the attributes 'global' and 'multiline'.
 */
const reverseSanitationReplaceList = {
  '\\&gt;': '>',
  '\\&lt;': '<',
};

/**
 * A regex that is used the remove all comments in a css file.
 */
const cssCommentsRegex = /\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/gm;
//#endregion

//#region Tag names
/**
 * Tag names that occupy the attribute 'src' by html standards.
 */
const tagNamesUsingSrcAttribute = ['AUDIO', 'EMBED', 'IFRAME', 'IMG', 'INPUT', 'SCRIPT', 'SOURCE', 'TRACK', 'VIDEO'];

/**
 * Tag names that will get skipped during the scanning process.
 */
const ignoredTagNameList = ['SCRIPT', 'STYLE', 'LINK', 'META'];

/**
 * Tag names that will not call the render function automatically.
 */
const noRenderingTagNameList = ['FUNCTION'];
//#endregion

//#region Records
/**
 * Keeps track of all the function defined.
 */
let functions: Record<string, string> = {};

/**
 * Stores cached fetch request.
 */
let srcCache: Record<string, string> = {};
//#endregion

//#region Miscellaneous
/**
 * Makes sure the variable '__parent' exists even without nesting html elements using the inline script syntax.
 */
var __parent: any;
//#endregion
//#endregion

//#region Functions

//#region Load content
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
function load(url: string, forceFetch: boolean = false): void {
  if (forceFetch) removeFromCache(url);

  this.inlineScriptSrc = url;
  this.render(true);
}

/**
 * This will fetch an url and caches it in the variable 'srcCache'.
 * If the request already got cached it will return the cache.
 *
 * @param url the url / path.
 * @param forceFetch if set true, it won't return the cache but rather fetch the file again.
 *
 * @returns a promise of the content of the request as string.
 */
const loadFromUrl = async (url: string, forceFetch: boolean = false): Promise<string> => {
  let res: string;

  if (srcCache[url] === undefined || forceFetch) res = await (await fetch(url)).text();
  else res = srcCache[url];
  srcCache[url] = res;

  return res;
};

/**
 * Removes an entry in the 'srcCache'.
 *
 * @param url the url that got cached.
 */
function removeFromCache(url: string) {
  srcCache[url] = undefined;
}
//#endregion

/**
 * Reverses the sanitation of an element.
 *
 * @param html the 'innerHTML' or content of an element.
 * @returns the content of an element reversed sanitized.
 */
function reverseSanitation(html: string): string {
  for (const [regex, replacement] of Object.entries(reverseSanitationReplaceList))
    html = html.replace(new RegExp(regex, 'gm'), replacement);

  return html;
}

/**
 * Escapes all special characters from a string.
 *
 * @param string the unescaped string.
 * @returns the script inputted but escaped.
 */
function escapeAll(string: string): string {
  return string
    .replace(/\\/gm, '\\\\')
    .replace(/\$/gm, '\\$')
    .replace(/'/gm, "\\'")
    .replace(/"/gm, '\\"')
    .replace(/`/gm, '\\`');
}

/**
 * Takes a string and return an collection of html elements.
 *
 * @param stringElement a string with valid html syntax
 * @returns a collection of all elements in the string as HTMLCollection
 */
function createElements(stringElement: string): HTMLCollection {
  const parent = document.createElement('div');
  parent.innerHTML = '<div>' + stringElement + '</div>';
  return (parent.firstChild as HTMLElement).children;
}

/**
 * Converts a NamedNodeMap to an object.
 *
 * @returns an object of the attributes in 'element'.
 */
function getAttributesFromElementsAsArray(element: HTMLElement): Record<string, string> {
  return Object.entries(
    Array.from(element.attributes).map((attribute: Attr) => [attribute.name, attribute.value])
  ) as any;
}

/**
 * Does the same as 'String.prototype.substr' but throws an error when the output string is empty.
 *
 * @returns the substring of a string.
 */
function substringThrow(string: string, start: number, length: number = undefined): string {
  const res = string.substr(start, length);
  if (res === '') throw 'substring is out of bounce.';
  return res;
}
//#endregion

//#region Scoped CSS
const scopedCss = {
  /**
   * This will remove all comments in a css.
   *
   * @param css the css as string with comments.
   * @returns the inputted css without comments.
   */
  removeAllCssComments(css: string): string {
    return css.replace(cssCommentsRegex, '');
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
    return SCOPED_CSS_PREFIX + scopedCSSId++;
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

//#region CSS
/**
 * This will add some additional css rules that are necessary for inline script to behave properly.
 */
const inlineScriptCss = document.createElement('style');
document.head.appendChild(inlineScriptCss);
inlineScriptCss.innerHTML += `function { display: none !important; }`;
//#endregion

//#region Handlers
//#region Handle inline script eval result

function handleInlineScriptEvalResultUndefined(result: any): boolean {
  return result === undefined;
}

function handleInlineScriptEvalResultHTMLCollection(element: HTMLElement, result: HTMLCollection): boolean {
  if (!(result instanceof HTMLCollection)) return;
  Array.from(result).forEach((child) => element.append(child));
  scopedCss.scopeStyles(element);
  return true;
}

function handleInlineScriptEvalResultHTMLElement(element: HTMLElement, result: HTMLElement): boolean {
  if (!(result instanceof HTMLElement)) return;
  element.append(result);
  scopedCss.scopeStyles(element);
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

//#region Handle result
function handleResult(result: any): string {
  if (result === undefined) return '';
  if (typeof result === 'string') return result;
  if (typeof result === 'number') return result.toString();
  if (result instanceof Array) return result.join('');
  return JSON.stringify(result);
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

const InlineScript = {
  //#region HTML Syntax
  /**
   * will generate some additional javascript code that should get executed before a new instance
   * of the 'InlineScriptInstance' gets created in a new scope.
   *
   * @param parentElement the parent element
   */
  generateEvalPreCode(parentElement: HTMLElement): string {
    let evalCode = '';
    evalCode += 'let parent=document.querySelector(".' + UNIQUE_CLASS_NAME_PREFIX + parentElement.ucn + '");';
    evalCode += 'let scope=parent,__parent=parent;';
    evalCode += 'let state={render(){Array.from(parent.children).forEach(_=>_.render())}};';
    return evalCode;
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
    inlineScript = reverseSanitation(inlineScript);

    // let inQuotes = ''; // which quote got opened
    // let escapeQuotes = false; // if there is a escape character for quotes
    let depth = 0; // the depth of the html expression

    let newInlineScript = '';

    try {
      for (let i = 0; i < inlineScript.length; i++) {
        let c = substringThrow(inlineScript, i, 1);
        let cc = substringThrow(inlineScript, i, 2);

        /**
         * @returns a string form i to the next index of 'char'
         */
        function find(char: string): string {
          const sub = substringThrow(inlineScript, i);
          const j = sub.indexOf(char);
          return substringThrow(sub, 0, j + 1);
        }

        /**
         * @returns true if the trimmed result of 'find' matches.
         */
        function expect(expect: string, char: string): boolean {
          return find(char).replace(/\n|\s/gm, '') === expect;
        }

        if (cc === '//') {
          while (substringThrow(inlineScript, i, 1) !== '\n') {
            newInlineScript += substringThrow(inlineScript, i, 1);
            i++;
          }
          i--;
          continue;
        }

        if (c === '(' && expect('(<', '<')) {
          depth++;

          if (depth === 1) {
            let evalCode = '';
            evalCode += 'eval(InlineScriptInstance+`';
            evalCode += this.generateEvalPreCode(element);
            evalCode += 'new InlineScriptInstance().fromString(\\`<';
            newInlineScript += evalCode;
            i++;
            continue;
          }
        }

        if (c === '>' && expect('>)', ')')) {
          depth--;

          if (depth === 0) {
            newInlineScript += '>\\`)`)';
            i++;
            continue;
          }
        }

        if (depth !== 0) c = escapeAll(escapeAll(c));
        newInlineScript += c;

        // if (inQuotes === '') {
        //   if (c === '"' || c === "'" || c === '`') {
        //     inQuotes = c;
        //   }
        // } else if (c === inQuotes && escapeQuotes === false) {
        //   inQuotes = '';
        // }

        // escapeQuotes = false;

        // if (inQuotes !== '' && c === '\\') {
        //   escapeQuotes = true;
        // }

        // if (inQuotes === '') {
        //   if (c === '(' && find('<').split(' ').join('').split('\n').join('') === '(<') {
        //     depth++;

        //     if (depth === 1) {
        //       let evalCode = '';
        //       evalCode += 'eval(InlineScriptInstance+`';
        //       evalCode += this.generateEvalPreCode(element);
        //       evalCode += 'new InlineScriptInstance().fromString(\\`<';
        //       newInlineScript += evalCode;
        //       i++;
        //       continue;
        //     }
        //   }
        // }

        // if (inQuotes === '') {
        //   if (c === '>' && find(')').split(' ').join('').split('\n').join('') === '>)') {
        //     depth--;

        //     if (depth === 0) {
        //       newInlineScript += '>\\`)`)';
        //       i++;
        //       continue;
        //     }
        //   }
        // }
      }
    } catch {}

    return newInlineScript;
  },
  //#endregion
};

class InlineScriptInstance {
  //#region Constructor
  constructor() {
    this.setupReaction();
  }
  //#endregion

  //#region Reaction
  reactiveElements: Record<string, Array<HTMLElement>> = {};
  oldValues: Record<string, any> = {};

  setupReaction() {
    setInterval(() => {
      this.reaction();
    }, 50);
  }

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

    let newVars: Record<string, any> = {};

    element.render = function (calledAutomatically: boolean = false) {
      if (element.static) return;

      element.inlineScriptAttributes.forEach(({ name, value }) => {
        const res = handleResult(eval(value));
        element.setAttribute(name, res);
      });

      if (element.fixedHTML) return that.handleInnerHTMLAttribute(element);

      if (element.functionName !== undefined || element.inlineScriptSrc !== undefined) {
        const virtualElement = document.createElement('div');

        try {
          handleInlineScriptEvalResult(virtualElement, eval(element.inlineScript), true);
        } catch (err) {
          handleExceptionResult(virtualElement, err);
        }

        newVars.innerHTML = virtualElement.innerHTML;
        newVars.args = getAttributesFromElementsAsArray(this);
      }

      if (element.functionName !== undefined) {
        const innerHTML = newVars.innerHTML;
        const args = newVars.args;

        element.innerHTML = functions[element.functionName];

        eval(InlineScriptInstance + 'new InlineScriptInstance().scanAll(element.children)');

        return;
      }

      if (element.hasInlineScript()) {
        try {
          handleInlineScriptEvalResult(element, eval(element.inlineScript), true);
        } catch (err) {
          handleExceptionResult(element, err);
        }

        return;
      }

      if (element.inlineScriptSrc !== undefined) {
        return loadFromUrl(element.inlineScriptSrc).then(async (content: string) => {
          const innerHTML = newVars.innerHTML;
          const args = newVars.args;

          handleInlineScriptEvalResult(
            element,
            eval(
              InlineScriptInstance +
                InlineScript.generateEvalPreCode(element) +
                'new InlineScriptInstance().fromString(`' +
                escapeAll(content) +
                '`);'
            ),
            true
          );
        });
      }

      if (!calledAutomatically) that.scan(element);
    };
  }
  //#endregion

  //#region Inline script
  compileInlineScript(element: HTMLElement) {
    if (!this.isInlineScript(element)) return;
    element.setUcn();
    element.setInlineScript(InlineScript.compileHTMLSyntax(element.innerHTML, element));
  }

  isInlineScript(element: HTMLElement): boolean {
    return element.innerHTML.trim().startsWith('{');
  }
  //#endregion

  //#region Attributes
  compileAttributes(element: HTMLElement) {
    const attributes = Array.from(element.attributes);

    const inlineScriptAttributes = [];

    attributes.forEach((attribute) => {
      if (attribute.value.trim().startsWith('{')) {
        inlineScriptAttributes.push(attribute);
      }
    });

    element.inlineScriptAttributes = inlineScriptAttributes;
  }

  handleAttributes(element: HTMLElement) {
    this.hasReaction(element) && this.addReaction(element);
    this.hasValidSrcAttribute(element) && this.handleSrcAttribute(element);
    this.hasEventAttribute(element) && this.handleEventAttributes(element);
    if (this.hasInnerHTMLAttribute(element)) element.fixedHTML = true;
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

  //#region Event attribute
  hasEventAttribute(element: HTMLElement): boolean {
    return Array.from(element.attributes).findIndex((attribute) => attribute.name.startsWith('on')) !== -1;
  }

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

  //#region Inner html attribute
  hasInnerHTMLAttribute(element: HTMLElement): boolean {
    return element.hasAttribute('innerhtml');
  }

  handleInnerHTMLAttribute(element: HTMLElement) {
    if (this.hasInnerHTMLAttribute(element)) element.innerHTML = element.getAttribute('innerhtml');
    else element.innerHTML = '';
  }
  //#endregion

  //#region Src attribute
  /**
   * Checks if the element has a src attribute and ignores tag names that
   * already use this attribute for other purposes.
   */
  hasValidSrcAttribute(element: HTMLElement): boolean {
    return element.hasAttribute('src') && !tagNamesUsingSrcAttribute.includes(element.tagName);
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
    if (element.attributes.length < 1) return true;
    const name = element.attributes[0].name;

    functions[name.toUpperCase()] = element.innerHTML;

    return true;
  }

  callsFunction(element: HTMLElement) {
    if (!Object.keys(functions).includes(element.tagName)) return;
    element.functionName = element.tagName;
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
   * Tells if the scan script should scan the children of an element
   */
  shouldScanChildren(element: HTMLElement): boolean {
    return !element.hasInlineScript() && element.inlineScriptSrc === undefined;
  }

  isStatic(element: HTMLElement): boolean {
    return (
      element.hasAttribute('static') ||
      __parent?.hasAttribute('static') ||
      element.parentElement?.hasAttribute('static')
    );
  }

  /**
   * Will scan a html element
   *
   * @param element the element that will get scanned
   * @param recursive if true the child elements will get scanned as well
   */
  scan(element: HTMLElement, recursive: boolean = true) {
    if (element === undefined) return;

    if (this.checkTagName(element)) return;

    this.callsFunction(element);
    this.compileAttributes(element);
    this.compileInlineScript(element);
    this.setRenderFunction(element);
    this.handleAttributes(element);

    if (this.isStatic(element)) element.setAttribute('static', 'true');

    if (!noRenderingTagNameList.includes(element.tagName)) element.render(true);

    if (element.hasAttribute('static')) element.static = true;

    if (recursive && this.shouldScanChildren(element)) this.scanAll(element.children);
  }

  isValidScriptTag(element: HTMLElement): boolean {
    return (
      element.tagName === 'SCRIPT' && element.parentElement !== document.body && element.parentElement !== document.head
    );
  }

  filterScripts(elements: HTMLCollection): Array<HTMLElement> {
    const scriptElements = [];
    for (const element of elements) this.isValidScriptTag(element as HTMLElement) && scriptElements.push(element);
    return scriptElements;
  }

  /**
   * Runs the scan function on all html elements
   */
  scanAll(elements: HTMLCollection) {
    const scriptElements = this.filterScripts(elements);
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
        newInlineScript(element as HTMLElement);
      } else {
        this.scan(element as HTMLElement);
      }
    }
  }
  //#endregion

  //#region From string
  fromString(stringElement: string) {
    const elements = createElements(stringElement);
    this.scanAll(elements);
    return elements;
  }
  //#endregion
}

//#region Setup
/**
 * Will initiate everything automatically
 */
function inlineScript() {
  const inlineScript = new InlineScriptInstance();
  [document.head, document.body].forEach((element) => inlineScript.scan(element));
  scopedCss.scopeAllStyles();
}

/**
 * Will initiate a new instance of InlineScript and call the scan function on the element
 *
 * This is useful if you have variables in your scope that you want to get rid of.
 *
 * @param element the element that will get scanned in a new instance of InlineScript
 */
function newInlineScript(element: HTMLElement) {
  new InlineScriptInstance().scan(element);
}

// imitating the state variable
const state = {
  render() {
    Array.from(document.body.children).forEach((_: any) => {
      if (_.render !== undefined) _.render();
    });
  },
};
//#endregion

const res = InlineScript.compileHTMLSyntax(
  `{{
  const bar = 10;

 // (<h1>bar</h1>)
}}`,
  document.head.children[0] as HTMLElement
);

console.log(res);

//#region scoped css
function scope(scope, css) {
    css = css.replace(/\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/g, "")

    const regex = /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g
    let m
    let replaceList = []

    while ((m = regex.exec(css)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++
        }

        let match = m[0]
        const index = m.index
        match = match.trim()
        if (!match.startsWith('@') && !match.startsWith('from') && !match.startsWith('to') && !/[\d]/.test(match.substr(0, 1))) {
            let end = css.substr(index).trim()
            if (end.startsWith('#this')) end = end.substr(6)
            css = css.substring(0, index) + scope + ' ' + end
            regex.lastIndex += scope.length + 1
        }
    }

    return css
}

let SCOPEDCSSID = 0
function getUniqueStyleId() { return 'scoped-css-id-' + SCOPEDCSSID++ }

function scopeStyles(element) {
    let styles = Array.from(element.querySelectorAll('style[scoped]'))

    styles.forEach((styleElement) => {
        const parentElement = styleElement.parentElement
        const parentClass = getUniqueStyleId()
        parentElement.classList.add(parentClass)

        const style = scope("." + parentClass, styleElement.innerHTML)
        styleElement.innerHTML = style
        styleElement.removeAttribute('scoped')
    })

    styles = Array.from(element.querySelectorAll('style[scope]'))

    styles.forEach((styleElement) => {
        const style = scope(styleElement.attributes.getNamedItem('scope').value, styleElement.innerHTML)
        styleElement.innerHTML = style
        styleElement.removeAttribute('scope')
    })
}

function scopeAllStyles() { scopeStyles(document.querySelector('html')) }

scopeAllStyles()
//#endregion

// Custom properties

HTMLElement.prototype.render = function () {
    renderElement.call(this)
}

Object.defineProperty(HTMLElement.prototype, 'hasInlineScript', {
    get: function () { return this.inlineScript_ !== undefined }
})

const hasInlineScriptClassName = 'has-inline-script'
Object.defineProperty(HTMLElement.prototype, 'inlineScript', {
    get: function () { return this.inlineScript_ !== undefined ? this.inlineScript_ : '' },
    set: function (value) {
        if (this.inlineScript_ === undefined) {
            let inlineScript = value
            inlineScript = compileInlineScript(inlineScript)
            this.inlineScript_ = inlineScript
            compileAttributes.call(this)
        }
        this.classList.add(hasInlineScriptClassName)
    }
})

Object.defineProperty(HTMLElement.prototype, 'uid', {
    get: function () {
        if (this.uid_ === undefined) return (this.uid_ = newUID())
        return this.uid_
    }
})

Object.defineProperty(HTMLElement.prototype, 'inlineScriptAttributes', {
    get: function () {
        return this.inlineScriptAttributes_ || []
    },
    set: function (value) {
        this.inlineScriptAttributes_ = value
    }
})

// Custom functions

function load(element, url, args) {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.onload = function () {
        with (args || {}) {
            let child

            try {
                child = eval(renderElement + htmlExpression + 'htmlExpression(this.responseText)')
            } catch (err) {
                // ERROR
                child = createElement('<div class="error">' + err + '</div>')
            }

            element.innerHTML = ""
            element.append(child)
            scopeStyles(element)
        }
    }
    xmlHttp.open("GET", url, true)
    xmlHttp.send(null)

    return ''
}

// Inline script

function convertEvalResults(element, result) {
    element.innerHTML = ''

    if (result === undefined) return element

    if (result instanceof HTMLElement) {
        element.append(result)
        scopeStyles(element)
        return element
    }

    if (result instanceof Array) {
        const isListHTMLElement = result.every(i => i instanceof HTMLElement)

        if (isListHTMLElement) {
            result.forEach(child => element.append(child))
            scopeStyles(element)
            return element
        }

        result = result.join('')
        element.innerHTML = result
        return element
    }

    element.innerHTML = result

    return element
}

function renderAttributes(callback) {
    const attributes = this.inlineScriptAttributes
    const regex = /\{\{(.*?)\}\}/gm

    attributes.forEach(attribute => {
        while ((m = regex.exec(attribute.value)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++
            }

            const match = m[0]
            const index = m.index

            let res = callback(match)
            if (res === undefined) res = ''

            let { value } = attribute
            value = value.substring(0, index) + res.toString() + value.substr(index + match.length)
            this.attributes[attribute.name].value = value
            regex.lastIndex += res.toString().length
        }
    })
}

function renderElement() {
    renderAttributes.call(this, (m) => eval(m))
    if (this.hasInlineScript) return convertEvalResults(this, eval(this.inlineScript))
    return this
}

// Scan

function scan(element, compile) {
    setUniqueClassName(element)

    if (hasInlineScript(element)) {
        element.inlineScript = element.innerHTML
        compile(element)
    } else {
        scanChildren(element, (child) => {
            scan(child, compile)
        })
    }
}

function scanChildren(element, callback) {
    Array.from(element.children).forEach(v => callback(v))
}

let InlineScriptUID = 0
const UIDPrefix = "inline-script-uid-"
function newUID() { return InlineScriptUID++ }

function setUniqueClassName(element) {
    element.classList.add(UIDPrefix + element.uid)
}

function hasInlineScript(element) {
    if (element.tagName === "SCRIPT" || element.tagNAME === "STYLE") return false
    return element.innerHTML.trim().startsWith("{")
}

function createElement(html) {
    const parent = document.createElement("div")
    parent.innerHTML = html
    return parent.firstChild
}

function htmlExpression(html) {
    let element = createElement(html)

    scan(element, (e) => {
        renderElement.call(e)
    })

    return element
}

function reverseSanitation(html) {
    const replaceList = {
        '&gt;': '>',
        '&lt;': '<',
    }
    Object.keys(replaceList).forEach((i) => {
        html = html.replaceAll(i, replaceList[i])
    })

    return html
}

function compileInlineScript(inlineScript) {
    inlineScript = reverseSanitation(inlineScript)

    let inQuotes = ""
    let escapeQuotes = false
    let htmlExpressionDepth = 0

    let newInlineScript = ""

    for (let i = 0; i < inlineScript.length; i++) {
        const c = inlineScript.substr(i, 1)

        function find(char) {
            const sub = inlineScript.substr(i)
            const j = sub.indexOf(char)
            return sub.substring(0, j + 1)
        }

        if (inQuotes === "") {
            if (c === "\"" || c === "'" || c === "`") {
                inQuotes = c
            }
        } else if (c === inQuotes && escapeQuotes === false) {
            inQuotes = ""
        }

        escapeQuotes = false

        if (inQuotes !== "" && c === "\\") {
            escapeQuotes = true
        }

        if (inQuotes === "") {
            if (c === "(" && find("<").replaceAll(" ", "").replaceAll("\n", "") === "(<") {
                htmlExpressionDepth++

                if (htmlExpressionDepth === 1) {
                    newInlineScript += "eval(`" + renderElement + "\n\n" + htmlExpression + "\n\n" + 'htmlExpression(\\`<'
                    i++
                    continue
                }

            }
        }

        if (inQuotes === "") {
            if (c === ">" && find(")").replaceAll(" ", "").replaceAll("\n", "") === ">)") {
                htmlExpressionDepth--

                if (htmlExpressionDepth === 0) {
                    newInlineScript += '>\\`)`)'
                    i++
                    continue
                }
            }
        }

        newInlineScript += c
    }

    return newInlineScript
}

function compileAttributes() {
    const attributes = Array.from(this.attributes)
    let inlineScriptAttributes = []

    attributes.forEach(v => {
        if (/{\s*{/gm.test(v.value)) {
            inlineScriptAttributes.push({ name: v.name, value: v.value })
        }
    })

    this.inlineScriptAttributes = inlineScriptAttributes
}

function inlineScript() {
    scan(document.body, (v) => {
        v.render()
    })

    document.body.classList.remove("invisible")
}
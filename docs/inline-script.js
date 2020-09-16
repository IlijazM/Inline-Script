//#region Scoped css
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

function scopeAllStyles() { scopeStyles(document) }
//#endregion

//#region Const vars
const hasInlineScriptClassName = 'has-inline-script'
const UIDPrefix = "inline-script-uid-"
let InlineScriptUID = 0
//#endregion

//#region Functions
function getRequest(url, res) {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.onload = res(xmlHttp)
    xmlHttp.open("GET", url, true)
    xmlHttp.send(null)
}

function load(element, url, args) {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.onload = function () {
        with (args || {}) {
            let child

            try {
                child = eval('eval(eval(inlineScript).toString());inlineScript(this.responseText)')
            } catch (err) {
                // ERROR
                child = document.createElement('div')
                handleExceptionResult(child, err)
            }

            element.innerHTML = ""
            element.append(child)

            const scripts = element.querySelectorAll("script")
            scripts.forEach((script) => {
                const scriptElement = document.createElement("script")
                if (script.attributes.src !== undefined) scriptElement.setAttribute('src', script.attributes.src.value)
                if (script.attributes.async !== undefined) scriptElement.setAttribute('async', script.attributes.async.value)
                if (script.attributes.defer !== undefined) scriptElement.setAttribute('defer', script.attributes.defer.value)
                scriptElement.innerHTML = script.innerHTML
                document.head.appendChild(scriptElement)
            })
        }
    }
    xmlHttp.open("GET", url, true)
    xmlHttp.send(null)

    return ''
}
//#endregion

//#region Custom properties
HTMLElement.prototype.render = function () {
}

Object.defineProperty(HTMLElement.prototype, 'hasInlineScript', {
    get: function () { return this.inlineScript_ !== undefined }
})

Object.defineProperty(HTMLElement.prototype, 'inlineScript', {
    get: function () { return this.inlineScript_ !== undefined ? this.inlineScript_ : '' },
    set: function (value) {
        if (this.inlineScript_ === undefined) {
            let inlineScript = value
            inlineScript = compileInlineScript(inlineScript)
            this.inlineScript_ = inlineScript
            this.classList.add(hasInlineScriptClassName)
        }
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
//#endregion

//#region Compiler
function compileInlineScript(inlineScript) {
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
                    newInlineScript += 'eval(`eval(eval(inlineScript).toString());' + 'inlineScript(\\`<'
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
//#endregion

//#region Util functions
function setUniqueClassName(element) {
    if (element.uid !== undefined) return
    element.uid = newUID()
    element.classList.add(UIDPrefix + element.uid)
}

function hasInlineScript(element) {
    if (element.tagName === "SCRIPT" || element.tagNAME === "STYLE") return false
    return element.innerHTML.trim().startsWith("{")
}

function isDefineExpression(element) {
    return element.tagName === "DEFINE"
}

function createElement(html) {
    const parent = document.createElement("div")
    parent.innerHTML = html
    return parent.firstChild
}

function newUID() { return InlineScriptUID++ }
//#endregion

//#region Handlers
function handleExceptionResult(element, err) {
    element.style.background = 'red'
    element.style.color = 'yellow'
    element.style.fontSize = '20px'
    element.innerHTML = err
}

function handleRenderResults(element, result) {
    element.innerHTML = ''

    if (result === undefined) return

    if (result instanceof HTMLCollection) {
        Array.from(result).forEach(child => element.append(child))
        return
    }

    if (result instanceof HTMLElement) {
        element.append(result)
        return
    }

    if (result instanceof Array) {
        const isListHTMLElement = result.every(i => i instanceof HTMLElement)

        if (isListHTMLElement) {
            result.forEach(child => element.append(child))
            return
        }

        result = result.join('')
        element.innerHTML = result
        return
    }

    element.innerHTML = result

    return
}
//#endregion

//#region Type conversions
function attributeStringToVariable(str) {
    try {
        let type = eval("let _=" + str + ";_")
        return type
    } catch (err) {
        return str
    }
}
//#endregion

//#region Macros
let macros = {}

function addMacro(tag, value) {
    macros[tag] = value
}

function macro(element) {
    try {
        const tag = element.attributes[0]

        addMacro(tag.name, element.innerHTML)
    } catch (err) {
        console.error('Something went wrong with define:')
        console.error(err)
    }

    element.innerHTML = ''
}

function updateMacros(element) {
    if (element === undefined) element = document.body

    for (let macro in macros) {
        const value = macros[macro]

        function convert(el, value) {
            const html = el.innerHTML

            function renameHTMLTagName(element, newTagName) {
                const uniqueClassName = '_' + Array(10).fill(0).map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('')

                element.classList.add(uniqueClassName)

                let { outerHTML, tagName } = element

                outerHTML = '<' + newTagName + outerHTML.substring(1 + tagName.length, outerHTML.length - tagName.length - 1) + newTagName + '>'
                element.outerHTML = outerHTML

                element = document.querySelector('.' + uniqueClassName)
                element.classList.remove(uniqueClassName)
                return element
            }

            el = renameHTMLTagName(el, 'div')
            el.innerHTML = value

            let args = { html: html }

            Array.from(el.attributes).forEach(v => {
                if (!['class', 'id', 'style', 'load', 'reacts-to'].includes(v.name))
                    args[v.name] = attributeStringToVariable(v.value)
            })

            with (args) {
                eval(inlineScript + 'inlineScript(el)')
            }
        }

        if (element.tagName === macro.toUpperCase()) {
            convert(element, value)
        }

        const elements = Array.from(document.querySelectorAll(macro))

        elements.forEach(el => {
            convert(el, value)
        })
    }
}
//#endregion

function inlineScript(args) {
    //#region Rendering
    function setRenderFunction(element) {
        if (element.tagName !== 'BUTTON') {
            element.render = function () {
                const scope = this

                try {
                    handleRenderResults(this, eval(this.inlineScript))
                } catch (err) {
                    handleExceptionResult(this, err)
                }

                renderAttributes(this)

                return this
            }

            return
        }

        element.render = function () {
            renderAttributes(this)
            return this
        }

        element.onclick = function () {
            eval(this.inlineScript)
        }
    }
    //#endregion

    //#region Attributes
    function compileAttributes(element) {
        const attributes = Array.from(element.attributes)
        let inlineScriptAttributes = []

        attributes.forEach(v => {
            if (/{\s*{/gm.test(v.value)) {
                inlineScriptAttributes.push({ name: v.name, value: v.value })
            }
        })

        const reactsToAttribute = attributes.find(v => v.name === 'reacts-to')
        if (reactsToAttribute) {
            addReaction(reactsToAttribute.value, element.uid)
        }

        element.inlineScriptAttributes = inlineScriptAttributes
    }

    function renderAttributes(element) {
        const attributes = element.inlineScriptAttributes
        const regex = /\{\{(.*?)\}\}/gm

        attributes.forEach(attribute => {
            while ((m = regex.exec(attribute.value)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++
                }

                const match = m[0]
                const index = m.index

                let res = eval(match)
                if (res === undefined) res = ''

                let { value } = attribute
                value = value.substring(0, index) + res.toString() + value.substr(index + match.length)
                element.attributes[attribute.name].value = value
                regex.lastIndex += res.toString().length
            }
        })

        // load
        const loadAttribute = element.attributes.load
        if (loadAttribute !== undefined) {
            scanChildren(element)

            let args = { html: element.children }

            Array.from(element.attributes).forEach(v => {
                if (!['class', 'id', 'style', 'load', 'reacts-to'].includes(v.name))
                    args[v.name] = attributeStringToVariable(v.value)
            })

            load(element, loadAttribute.value, args)
        }

        // button
        const valueAttribute = element.attributes.value
        if (valueAttribute !== undefined && element.hasInlineScript && element.tagName === "BUTTON") {
            element.innerHTML = valueAttribute.value
        }
    }
    //#endregion

    //#region Scan
    function scan(element) {
        if (isDefineExpression(element)) {
            macro(element)
            return
        }
        if (hasInlineScript(element)) {
            setUniqueClassName(element)
            element.inlineScript = element.innerHTML

            compileAttributes(element)
            setRenderFunction(element)
            element.render()
        } else {
            compileAttributes(element)
            renderAttributes(element)
            scanChildren(element)
        }
    }

    function scanChildren(element) {
        Array.from(element.children).forEach(child => scan(child))
    }
    //#endregion

    //#region Reactions
    let reactiveElements = {}
    let oldValues = []
    setInterval(() => {
        for (let varName in reactiveElements) {
            const reactiveElement = reactiveElements[varName]
            const varValue = eval(varName)

            if (oldValues[varName] !== varValue) {
                oldValues[varName] = varValue;
                for (let i = 0; i < reactiveElement.length; i++) {
                    try {
                        document.querySelector("." + UIDPrefix + reactiveElement[i]).render()
                    } catch (err) {
                        console.log(err)
                        console.group('removed element')
                        console.log('.' + UIDPrefix + reactiveElement[i])
                        console.groupEnd('removed element')

                        reactiveElements[varName] = reactiveElement.filter((v, j) => j !== i)
                    }
                }
            }
        }
    }, 50)

    function addReaction(varName, uid) {
        if (reactiveElements[varName] === undefined) reactiveElements[varName] = []
        reactiveElements[varName].push(uid)
    }
    //#endregion

    //#region Execution
    setTimeout(() => {
        updateMacros()
        scopeAllStyles()
    })

    if (args === undefined) {
        scan(document.body)
        scopeAllStyles(document.body)
        return document.body
    }

    if (args instanceof HTMLElement) {
        scan(args)
        scopeAllStyles(args)
        updateMacros(args)
        return args
    }

    if (typeof args === 'string') {
        let element = createElement(args)
        scan(element)
        scopeAllStyles(element)
        return element
    }
    //#endregion
}
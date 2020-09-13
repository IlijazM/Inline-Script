// Custom properties

HTMLElement.prototype.render = function () {
    render.call(this)
}

Object.defineProperty(HTMLElement.prototype, 'hasInlineScript', {
    get: function () { return this.inlineScript_ !== undefined }
})

const hasInlineScriptClassName = "has-inline-script"
Object.defineProperty(HTMLElement.prototype, 'inlineScript', {
    get: function () { return this.inlineScript_ !== undefined ? this.inlineScript_ : '' },
    set: function (value) {
        if (this.inlineScript_ === undefined) {
            let inlineScript = value
            inlineScript = compileInlineScript(inlineScript)
            this.inlineScript_ = inlineScript
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

// Custom functions

function load(element, url, args) {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.onload = function () {
        with (args || {}) {
            let child

            try {
                child = eval(render + htmlExpression + 'htmlExpression(this.responseText)')
            } catch (err) {
                // ERROR
                child = createElement('<div class="error">' + err + '</div>')
            }

            element.innerHTML = ""
            element.append(child)
        }
    }
    xmlHttp.open("GET", url, true)
    xmlHttp.send(null)

    return "loading..."
}

// Inline script

function render() {
    if (this.hasInlineScript) return convertResults(this, eval(this.inlineScript))
}

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

function hasInlineScript(element) {
    if (element.tagName === "SCRIPT" || element.tagNAME === "STYLE") return false
    return element.innerHTML.trim().startsWith("{")
}

function scanChildren(element, callback) {
    Array.from(element.children).forEach(v => callback(v))
}

function convertResults(element, result) {
    element.innerHTML = ""

    if (result instanceof HTMLElement) {
        element.append(result)
        return element
    }

    if (result === undefined) result = ''
    if (result instanceof Array) {
        const isListHTMLElement = result.every(i => i instanceof HTMLElement)

        if (isListHTMLElement) {
            result.forEach(child => {
                element.append(child)
            })
            return element
        }

        result = result.join('')
        element.innerHTML = result
        return element
    }

    element.innerHTML = result

    return element
}

function createElement(html) {
    const parent = document.createElement("div")
    parent.innerHTML = html
    return parent.firstChild
}

function htmlExpression(html) {
    let element = createElement(html)

    scan(element, () => { })

    return render.call(element)
}

function reverseSanitation(html) {
    const replaceList = {
        '&gt;': '>',
        '&lt;': '<',
    }
    Object.keys(replaceList).forEach((i) => {
        html = html.split(i).join(replaceList[i])
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
                    newInlineScript += "eval(`" + render + "\n\n" + htmlExpression + "\n\n" + 'htmlExpression(\\`<'
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

let InlineScriptUID = 0
const UIDPrefix = "inline-script-uid-"
function newUID() { return InlineScriptUID++ }

function setUniqueClassName(element) {
    element.classList.add(UIDPrefix + element.uid)
}

function inlineScript() {
    scan(document.body, (v) => {
        v.render()
    })

    document.body.classList.remove("invisible")
}
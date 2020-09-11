HTMLElement.prototype.render = function () {
    render(this)
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

function convertResults(element, result) {
    if (result instanceof HTMLElement) {
        element.append(result)
        return
    }

    if (result === undefined) result = ''
    if (result instanceof Array) result = result.join('')

    element.innerHTML = result
}

function render(element) {
    if (element.hasInlineScript) convertResults(element, eval(element.inlineScript))
}

function createElement(element) {
    const parent = document.createElement("div")
    parent.innerHTML = element
    return parent.firstChild
}

function htmlExpression(html) {
    let element = createElement(html)

    scan(element, () => { })
    render(element)
}

function compileInlineScript(inlineScript) {
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

        if (inQuotes === "" && htmlExpressionDepth === 0) {
            if (c === "(" && find("<").replaceAll(" ", "").replaceAll("\n", "") === "(<") {
                newInlineScript += render + "\n" + htmlExpression + "\n" + 'htmlExpression(`<'
                htmlExpressionDepth++
                i++
                continue
            }
        }

        if (inQuotes === "" && htmlExpressionDepth === 1) {
            if (c === ">" && find(")").replaceAll(" ", "").replaceAll("\n", "") === ">)") {
                newInlineScript += '>`)'
                htmlExpressionDepth--
                i++
                continue
            }
        }

        newInlineScript += c
    }

    return newInlineScript
}
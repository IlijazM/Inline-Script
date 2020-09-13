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
        return element
    }

    element.innerHTML = result

    return element
}

function render(element) {
    if (element.hasInlineScript) return convertResults(element, eval(element.inlineScript))
}

function createElement(html) {
    const parent = document.createElement("div")
    parent.innerHTML = html
    return parent.firstChild
}

function htmlExpression(html) {
    let element = createElement(html)

    scan(element, () => { })

    return render(element)
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
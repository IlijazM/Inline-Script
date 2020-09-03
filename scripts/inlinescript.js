const $d = document
const body = $d.body
const head = $d.head
const $q = (v) => $d.querySelector(v)
const $qa = (v) => $d.querySelectorAll(v)
const append = (str) => body.innerHTML += str

function $e(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

const console_log = console.log
const console_error = console.error
const console_group = console.group
const console_groupEnd = console.groupEnd
const console_group_ = (g, f) => { console_group(g); f(); console_groupEnd(g) }

const importRegex = /import\s*\(/gm
const importRegexAlt = /import\s\s*(["'`])(?:(?=(\\?))\2.)*?\1/gm
const stringRegex = /(["'`])(?:(?=(\\?))\2.)*?\1/gm

const htmlStartRegex = /\(\s*</m
const htmlEndRegex = />\s*\)/gm

const htmlStartScript = "eval(`" + inlinescript + "inlinescript(COMMAND_COMPILE,{element:$e(\\`<"
const htmlEndScript = ">\\`)}).outerHTML`)"

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

const inlineScriptUidPrefix = "inline-script-uid-"
let inlineScriptId = 0
function generateUniqueId() { return inlineScriptId++ }

const COMMAND_COMPILE = 0
const COMMAND_INCLUDE = 1
const COMMAND_COMPILE_CHILDS = 2

function importBracketsHelper(element, url) { inlinescript(COMMAND_INCLUDE, { element: element, url: url }) }

function inlinescript(command, args) {
    function include(url, element) {
        const xmlHttp = new XMLHttpRequest()
        xmlHttp.onload = function () {
            element.innerHTML = xmlHttp.responseText

            const scripts = element.querySelectorAll("script")
            scripts.forEach((script) => {
                const scriptElement = document.createElement("script")
                scriptElement.innerHTML = script.innerHTML
                body.appendChild(scriptElement)
            })

            scopeStyles(element)

            inlinescript(COMMAND_COMPILE_CHILDS, { element: element })
        }
        xmlHttp.open("GET", url, true)
        xmlHttp.send(null)
    }

    function compileImportExpression(html) {
        // import 1
        {
            const regex = importRegex
            let m
            let replaceList = []

            while ((m = regex.exec(html)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++
                }

                m.forEach((match, groupIndex) => {
                    if (groupIndex === 0) {
                        if (!replaceList.includes(match)) replaceList.push(match)
                    }
                })
            }

            replaceList.forEach((replace) => {
                html = html.split(replace).join(inlinescript + importBracketsHelper + "importBracketsHelper(element,")
            })
        }

        // import 2
        {
            const regex = importRegexAlt
            let m
            let replaceList = []

            while ((m = regex.exec(html)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++
                }

                m.forEach((match, groupIndex) => {
                    if (groupIndex === 0) {
                        if (!replaceList.includes(match)) replaceList.push(match)
                    }
                })
            }

            replaceList.forEach((replace) => {
                stringRegex.lastIndex = 0
                const importString = stringRegex.exec(replace)[0]

                html = html.split(replace).join(inlinescript + "inlinescript(COMMAND_INCLUDE,{url:" + importString + ",element:element})")
            })
        }

        return html
    }

    function attributeStringToVariable(str) {
        try {
            let type = eval("let _=" + str + ";_")
            return str
        } catch (err) {
            return "'" + str + "'"
        }
    }

    function compileElementsImportAttribute(element) {
        if (element.attributes.getNamedItem("import") == null) return
        const url = element.attributes.getNamedItem("import").value

        let vars = ""
        const attributes = Array.from(element.attributes).filter((v) => !["reacts-to", "id", "class", "import"].includes(v.name))

        attributes.forEach((attribute) => {
            const _var = attributeStringToVariable(attribute.value)
            vars += "let " + attribute.name + "=" + _var + ";"
        })

        element.innerHTML = "{" + vars + "import \'" + url + "\'}"
    }

    function compileHtmlExpression(html) {
        html = html.replace(htmlStartRegex, htmlStartScript)

        const lastIndex = html.lastIndexOf(">)")
        if (lastIndex !== -1) html = html.slice(0, lastIndex) + htmlEndScript + html.slice(lastIndex + 2)

        return html
    }

    function compileReactions(element) {
        if (element.attributes.getNamedItem("reacts-to") == null) return

        const reactsTo = element.attributes.getNamedItem("reacts-to").value

        if (reactiveElements[reactsTo] == undefined) {
            addReactionListener(reactsTo)
        }

        reactiveElements[reactsTo].push(element.uniqueId)
    }

    function compileElementsContent(element) {
        try {
            element.hasInlinescript = false

            if (element.inlinescript !== undefined) return

            let content = element.innerHTML
            content = reverseSanitation(content)

            element.render = () => {
                console_group_("Element has no inline script:", () => console_log(element))
            }

            if (content.trim().startsWith("{")) {
                element.hasInlinescript = true
                content = compileHtmlExpression(content)
                content = compileImportExpression(content)
                element.inlinescript = content

                element.render = function () {
                    let eval_result

                    try {
                        eval_result = eval(element.inlinescript)
                    } catch (err) {
                        console_group_("An error occured while evaluating the script from element:", () => {
                            console_log(element)
                            console_log("script:")
                            console_log(element.inlinescript)
                            console_error(err)
                        })
                    }

                    // TODO: convert eval result into string
                    if (eval_result instanceof Array) eval_result = eval_result.join("")

                    if (element.tagName !== "BUTTON") element.innerHTML = eval_result
                }

                if (element.tagName == "BUTTON") {
                    let value = "SUBMIT"

                    try {
                        value = element.attributes.getNamedItem("value").value
                    } catch { }

                    element.innerHTML = value

                    const className = "." + inlineScriptUidPrefix + element.uniqueId
                    $q(className).setAttribute("onclick", "$q('" + className + "').render()")
                } else {
                    element.render()
                }
            }

        } catch (err) {
            console_group_("An error occured while compiling the content of the element:", () => {
                console_log(element)
                console_error(err)
            })
        }
    }

    function compileChilds(element) {
        const childs = Array.from(element.children)

        childs.forEach(child => {
            compileElement(child)
        })
    }

    function compileElement(element) {
        try {
            const uid = generateUniqueId()
            element.uniqueId = uid
            element.classList.add(inlineScriptUidPrefix + uid)

            compileElementsImportAttribute(element)
            compileElementsContent(element)

            if (!element.hasInlinescript) {
                compileChilds(element)
            } else {
                compileReactions(element)
            }
        } catch (err) {
            console_group_("An error occured while compiling the element:", () => {
                console_log(element)
                console_error(err)
            })
        }

        return element
    }

    let reactiveElements = {}
    function addReactionListener(varName) {
        reactiveElements[varName] = []
    }

    let oldValues = []
    setInterval(() => {
        for (let varName in reactiveElements) {
            const reactiveElement = reactiveElements[varName]
            const varValue = eval(varName)

            if (oldValues[varName] !== varValue) {
                oldValues[varName] = varValue;
                for (let i = 0; i < reactiveElement.length; i++) {
                    try {
                        $q("." + inlineScriptUidPrefix + reactiveElement[i]).render()
                    } catch {
                        console_group_("removed element", () => { console_log("." + inlineScriptUidPrefix + reactiveElement[i]) })
                        reactiveElements[varName] = reactiveElement.filter((v, j) => j !== i)
                    }
                }
            }
        }
    }, 50)

    if (command != undefined) {
        if (command === COMMAND_COMPILE) {
            compileElement(args.element)
            return args.element
        } else if (command === COMMAND_COMPILE_CHILDS) {
            compileChilds(args.element)
            return args.element
        } else if (command === COMMAND_INCLUDE) {
            include(args.url, args.element)
            return args.url
        }

    }
}

inlinescript(COMMAND_COMPILE, { element: body })

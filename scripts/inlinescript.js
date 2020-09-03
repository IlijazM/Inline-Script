const $d = document
const body = $d.body
const head = $d.head
const $q = (v) => $d.querySelector(v)
const $q_ = (v) => $d.querySelector("." + inlineScriptUidPrefix + v)
const $qa = (v) => $d.querySelectorAll(v)
const append = (str) => body.innerHTML += str

function $e(htmlString) {
    let div = document.createElement('div');
    div.style.display = "none"
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

const console_log = console.log
const console_error = console.error
const console_group = console.group
const console_groupEnd = console.groupEnd
const console_group_ = (g, f) => { console_group(g); f(); console_groupEnd(g) }

const importRegex = /include\s*\(/gm
const importRegexAlt = /import\s\s*(["'`])(?:(?=(\\?))\2.)*?\1/gm
const stringRegex = /(["'`])(?:(?=(\\?))\2.)*?\1/gm

const htmlStartRegex = /\(\s*</m
const htmlEndRegex = />\s*\)/gm

const doubleBracketsRegex = /\{\{(.*?)\}\}/gm

// const htmlStartScript = "eval(`" + inlinescript + "inlinescript(COMMAND_COMPILE,{element:$e(\\`<"
// const htmlEndScript = ">\\`)}).outerHTML`)"

// const htmlStartScript = "this.innerHTML=`"
// const htmlEndScript = "`;eval(`" + inlinescript + "setTimeout(()=>{inlinescript(COMMAND_COMPILE_CHILDS,{element:this}).innerHTML})`);this.innerHTML"

const htmlStartScript = "eval(`" + "const __timeout=true;this.innerHTML = \\`"
const htmlStartScriptAlt = "eval(`" + "const __timeout=false;this.innerHTML = \\`"
const htmlEndScript = "\\`;" + inlinescript + "if(__timeout){setTimeout(()=>{inlinescript(COMMAND_COMPILE_CHILDS,{element:this})})}else{inlinescript(COMMAND_COMPILE_CHILDS,{element:this})}this.innerHTML`)"

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

const badQuote = "`"

function inlinescript(command, args) {
    let parentUid = 0

    function include(url, element, callback) {
        const xmlHttp = new XMLHttpRequest()
        xmlHttp.onload = function () {
            if (callback === undefined) {

                element.innerHTML = xmlHttp.responseText
            } else {
                callback(element, xmlHttp.responseText)
            }

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

    function attributeStringToVariable(str) {
        try {
            let type = eval("let _=" + str + ";_")
            return str
        } catch (err) {
            return "'" + str + "'"
        }
    }

    function compileElementsImportAttribute(element) {
        if (element.attributes.getNamedItem("include") == null) return
        const url = element.attributes.getNamedItem("include").value

        let vars = ""
        const attributes = Array.from(element.attributes).filter((v) => !["reacts-to", "id", "class", "include"].includes(v.name))

        attributes.forEach((attribute) => {
            const _var = attributeStringToVariable(attribute.value)
            vars += "let " + attribute.name + "=" + _var + ";"
        })

        include(url, element, (element, res) => {
            element.innerHTML = "<div>{" + vars + "(<div>" + res + "</div>)}</div>"
        })

    }

    function compileHtmlExpression(html) {
        if (html.includes(badQuote)) {
            console.log("html: " + html)
            console.error("An inline script may not contain a '" + badQuote + "' symbol.")
        }

        let opened = 0
        let newHTML = ""
        for (let i = 0; i < html.length; i++) {
            const c = html.substr(i, 1)
            const cc = html.substr(i, 2)
            const ccc = html.substr(i, 3)

            if (cc === "(<") {
                opened++

                if (opened === 1) {
                    newHTML += htmlStartScript
                    continue
                }
            } else if (ccc === "(*<") {
                opened++

                if (opened === 1) {
                    i++
                    newHTML += htmlStartScriptAlt
                    continue
                }
            } else if (cc === ">)") {
                opened--

                if (opened === 0) {
                    newHTML += ">"
                    newHTML += htmlEndScript
                    i++
                    continue
                }
            }

            newHTML += c
        }

        return newHTML
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

            element.render = function () {
                this.compileAttributes()
                // console_group_("Element has no inline script:", () => console_log(element))
            }

            if (content.trim().startsWith("{")) {
                element.hasInlinescript = true
                content = compileHtmlExpression(content)
                element.inlinescript = content

                element.render = function () {
                    this.compileAttributes()
                    if (element.tagName == "BUTTON") {
                        let value = "SUBMIT"
                        try {
                            value = element.attributes.getNamedItem("value").value
                        } catch { }
                        element.innerHTML = value
                    }

                    let eval_result

                    try {
                        const query = function (s) { return document.querySelector("." + inlineScriptUidPrefix + parentUid + " " + s) }
                        const queryAll = function (s) { return document.querySelectorAll("." + inlineScriptUidPrefix + parentUid + " " + s) }

                        eval_result = eval(this.inlinescript)
                    } catch (err) {
                        console_group_("An error occured while evaluating the script from element:", () => {
                            console_log(this)
                            console_log("script:")
                            console_log(this.inlinescript)
                            console_error(err)
                        })
                    }

                    // TODO: convert eval result into string
                    if (eval_result instanceof Array) eval_result = eval_result.join("")

                    if (this.tagName !== "BUTTON") {
                        this.innerHTML = eval_result
                    } else {
                        this.compileAttributes()
                        let value = "SUBMIT"
                        try {
                            value = element.attributes.getNamedItem("value").value
                        } catch { }
                        element.innerHTML = value
                    }
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

    function compileElementsAttributes(element) {
        element.initialAttributes = []
        const attributes = Array.from(element.attributes)
        attributes.forEach((attribute) => {
            element.initialAttributes[attribute.name] = attribute.value
        })

        element.compileAttributes = function () {
            const attributes = Object.entries(element.initialAttributes)

            doubleBracketsRegex.lastIndex = 0
            attributes.forEach((v) => {

                let replaceList = []
                let attribute = v[1]
                let m

                while ((m = doubleBracketsRegex.exec(attribute)) !== null) {
                    if (m.index === doubleBracketsRegex.lastIndex) {
                        doubleBracketsRegex.lastIndex++
                    }

                    m.forEach((match, groupIndex) => {
                        if (groupIndex === 0) {
                            if (!replaceList.includes(match)) replaceList.push(match)
                        }
                    })
                }

                replaceList.forEach((replace) => {
                    let res

                    try {
                        res = eval(replace)
                        if (typeof res !== "string") res = JSON.stringify(res)
                    } catch {
                        res = "undefined"
                    }

                    this.setAttribute(v[0], attribute.split(replace).join(res))
                })
            })
        }

        element.compileAttributes()
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

            compileElementsAttributes(element)
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
                        document.querySelector("." + inlineScriptUidPrefix + reactiveElement[i]).render()
                    } catch (err) {
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
            parentUid = args.element.uniqueId
            compileChilds(args.element)
            return args.element
        }
    }

    /*
     * END
     */
}

inlinescript(COMMAND_COMPILE, { element: body })

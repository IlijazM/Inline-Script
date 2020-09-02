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

let reactiveElements = {}
function addReactionListener(varName) {
    reactiveElements[varName] = []
}

const COMMAND_COMPILE = 0
const COMMAND_INCLUDE = 1

function importBracketsHelper(element, url) { inlinescript(COMMAND_INCLUDE, { element: element, url: url }) }

function inlinescript(command, args) {
    function include(url, element) {
        const xmlHttp = new XMLHttpRequest()
        xmlHttp.onload = function () {
            element.innerHTML = xmlHttp.responseText
            inlinescript(COMMAND_COMPILE, { element: element })
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
                const importString = stringRegex.exec(replace)[0]

                html = html.split(replace).join(inlinescript + "inlinescript(COMMAND_INCLUDE,{url:" + importString + ",element:element})")
            })
        }

        return html
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

                element.render = () => {
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

                    element.innerHTML = eval_result
                }

                element.render()
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

    if (command != undefined) {
        if (command === COMMAND_COMPILE) {
            compileElement(args.element)
            return args.element
        } else if (command === COMMAND_INCLUDE) {
            include(args.url, args.element)
            return args.url
        }

    }
}

inlinescript(COMMAND_COMPILE, { element: body })

// reactions
let oldValues = []
setInterval(() => {
    for (let varName in reactiveElements) {
        const reactiveElement = reactiveElements[varName]
        const varValue = eval(varName)

        if (oldValues[varName] !== varValue) {
            oldValues[varName] = varValue;
            for (let i in reactiveElement) {
                try {
                    $q("." + inlineScriptUidPrefix + reactiveElement[i]).render()
                } catch {
                    console_log("removed element")
                    reactiveElements[varName] = reactiveElement.filter((v, j) => j !== i)
                }
            }
        }
    }
}, 50)
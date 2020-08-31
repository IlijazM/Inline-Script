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

const quotesRegex = /(["'´])(?:(?=(\\?))\2.)*?\1/gm
const htmlStartRegex = /\(\s*</m
const htmlEndRegex = />\s*\)/gm

const htmlStartScript = "eval(`" + inlinescript + "inlinescript($e(\\`<"
const htmlEndScript = ">\\`)).outerHTML`)"

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

function inlinescript(element) {
    function compileHtmlExpression(html) {
        html = html.replace(htmlStartRegex, htmlStartScript)

        const lastIndex = html.lastIndexOf(">)")
        if (lastIndex !== -1) html = html.slice(0, lastIndex) + htmlEndScript + html.slice(lastIndex + 2)

        return html
    }

    function compileElementsContent(element) {
        try {
            let content = element.innerHTML
            content = reverseSanitation(content)

            element.hasInlinescript = false

            element.render = () => {
                console_group_("Element has no inline script:", () => console_log(element))
            }

            if (content.trim().startsWith("{")) {
                element.inlinescript = compileHtmlExpression(content)
                element.hasInlinescript = true

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
            compileElementsContent(element)

            if (!element.hasInlinescript) {
                compileChilds(element)
            }
        } catch (err) {
            console_group_("An error occured while compiling the element:", () => {
                console_log(element)
                console_error(err)
            })
        }

        return element
    }

    function createElement() {

    }

    if (element != undefined) {
        compileElement(element)
        return element
    }
}

inlinescript(body)

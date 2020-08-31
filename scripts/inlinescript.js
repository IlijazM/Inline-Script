const $d = document
const body = $d.body
const head = $d.head
const $q = (v) => $d.querySelector(v)
const $qa = (v) => $d.querySelectorAll(v)
const append = (str) => body.innerHTML += str

const console_log = console.log
const console_error = console.error
const console_group = console.group
const console_groupEnd = console.groupEnd
const console_group_ = (g, f) => { console_group(g); f(); console_groupEnd(g) }

function compileHtmlExpression(html) {
    const quotesRegex = /(["'`])(?:(?=(\\?))\2.)*?\1/gm
    const htmlStartRegex = /\(\<(.|\n)*\>\)/gm
}

function compileElementsContent(element) {
    try {
        const content = element.innerHTML

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
}

compileElement(body)
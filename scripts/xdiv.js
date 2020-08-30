const d = document
const body = d.body
const head = d.head
const $ = (v) => d.querySelector(v)
const $a = (v) => d.querySelectorAll(v)
const append = (str) => body.innerHTML += str

function $e(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

let debug = false
function debugLog(message) {
    if (debug) console.log(message)
}

let I = 0;
function getUniqueClassName() {
    I++;
    return `xdiv-id-${I}`
}

async function GET(theUrl) {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", theUrl, false)
    xmlHttp.send(null)
    return xmlHttp
}

function cssToScopedCss(scope, css) {
    const STATE_CLOSED = 0
    const STATE_SCOPED = 1
    const STATE_OPENED = 2

    let newCss = ""
    let state = STATE_CLOSED

    for (let i = 0; i < css.length; i++) {
        const c = css.substr(i, 1)

        if (state === STATE_CLOSED && /[a-zA-Z_-]/.test(c)) {
            state = STATE_SCOPED
            newCss += scope + " " + css
            continue
        }

        if (state === STATE_SCOPED && c === ",") {
            newCss += scope + " " + css
            continue
        }

        if (state === STATE_SCOPED && c === "{") {
            state === STATE_OPENED
            newCss += css
            continue
        }

        if (state === STATE_OPENED && c === "}") {
            state === STATE_CLOSED
            newCss += css
            continue
        }

        newCss += css
    }

    return newCss
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

const compileHTML = `eval(\`
    let $__element__ = $e(\\\`#\\\`);
    ${compile}
    if ($__element__.innerHTML.trim().startsWith("{")) compile($__element__);
    $__element__.outerHTML
\`)
`

function compileHTMLExpression(html) {
    debugLog("compiling html expression")
    debugLog(html)

    if (html.includes('`')) {
        throw new Error("A scripted element may not contain a '`' symbol.")
    }

    let opened = 0
    let newHTML = ""
    for (let i = 0; i < html.length; i++) {
        const c = html.substr(i, 1)
        const cc = html.substr(i, 2)

        if (cc === "(<") {
            opened++

            if (opened === 1) {
                newHTML += compileHTML.split("#")[0]
                continue
            }
        } else if (cc === ">)") {
            opened--

            if (opened === 0) {
                newHTML += ">"
                newHTML += compileHTML.split("#")[1]
                i++
                continue
            }
        }

        newHTML += c
    }

    debugLog(newHTML)
    return newHTML
}

//#region reaction

let reactionSubscriptions = {}
function compileReactsTo(element, uid) {
    if (element.attributes.getNamedItem("reacts-to") != null) {
        const reacts_to = element.attributes.getNamedItem("reacts-to").value

        if (reactionSubscriptions[reacts_to] == null) {
            reactionSubscriptions[reacts_to] = ''
            let copy = "$__"
            for (let i = 0; i < reacts_to.length; i++) {
                const c = reacts_to.substr(i, 1)
                if (/[a-zA-Z$_0-9]/.test(c)) copy += c
                else copy += "_"
            }
            copy += "__"

            const script = d.createElement("script")
            script.innerHTML += `
                let ${copy} = ${reacts_to}
                setInterval(()=>{
                    if (${copy} !== ${reacts_to}) {
                        ${copy} = ${reacts_to};
                        console.log("REACT! '${reacts_to}'")
                        eval(reactionSubscriptions["${reacts_to}"])
                    }
                }, 10)
            `
            body.appendChild(script)
        }

        reactionSubscriptions[reacts_to] += `document.querySelector('.${uid}').render();`
    }
}

//#endregion

function compile(element) {
    debugLog("compiling element: ")
    debugLog(element)
    debugLog(element.outerHTML)

    let html = element.innerHTML
    html = reverseSanitation(html)
    html = compileHTMLExpression(html)

    element.initialContent = html

    const uid = getUniqueClassName()
    element.classList.add(uid)

    compileReactsTo(element, uid)

    element.render = function () {
        debugLog("render element: ")
        debugLog(element)
        debugLog(this.initialContent)

        let res = ""

        try {
            res = eval(this.initialContent)
        } catch (err) {
            console.error(err)
        }

        if (res instanceof Array) res = res.join("")
        if (res == undefined) res = ""

        this.innerHTML = res

        debugLog(this.outerHTML)
        debugLog("finish render")

        scan(element, false)
    }

    element.render()
}

function scan(parent, dontCompile) {
    debugLog("scanning element: ")
    debugLog(parent)
    const childs = Array.from(parent.children)

    for (const i in childs) {
        const element = childs[i]

        // skip scripts and styles
        if (["SCRIPT", "STYLE"].includes(element.tagName)) continue

        debugLog("looping over:")
        debugLog(element)
        debugLog(element.outerHTML)

        if (element.innerHTML.startsWith("{")) {
            if (dontCompile) continue
            debugLog("It is a inline javascript expression")

            compile(element)
        } else if (element.attributes.getNamedItem("xsrc") != null) {
            debugLog("It contains a 'xsrc' attribute")

            const xsrc = element.attributes.getNamedItem("xsrc").value

            GET(window.location.origin + "/" + xsrc).then((res) => {
                let content = res.responseText
                content = content.split("?").join("&quest;")
                element.innerHTML = content

                // evaluating scripts
                element.querySelectorAll("script").forEach((v) => {
                    let script = d.createElement("script")
                    script.innerHTML = v.innerHTML
                    body.appendChild(script)
                })

                // scoping styles
                element.querySelectorAll("style").forEach((v) => {
                    v.innerHTML = "/**/ " + v.innerHTML
                })

                scan(element)
            })
        } else {
            debugLog("It is a regular element")
            scan(element, dontCompile)
        }
    }

    debugLog("finish scanning")
}

scan(body)
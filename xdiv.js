const d = document
const body = d.body
const head = d.head
const $ = (v) => d.querySelector(v)
const $a = (v) => d.querySelectorAll(v)
const append = (str) => body.innerHTML += str

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

function compileHTMLExpression(html) {
    debugLog("compiling html expression")
    debugLog(html)

    let opened = 0
    let newHTML = ""
    for (let i = 0; i < html.length; i++) {
        const c = html.substr(i, 1)
        const cc = html.substr(i, 2)

        if (cc === "(<") {
            opened++

            if (opened === 1) {
                newHTML += "`"
                continue
            }
        } else if (cc === ">)") {
            opened--

            if (opened === 0) {
                newHTML += ">`"
                i++
                continue
            }
        }

        newHTML += c
    }

    debugLog(newHTML)
    return newHTML
}

function compile(element, id) {
    debugLog("compiling element: ")
    debugLog(element)
    debugLog(element.outerHTML)

    let html = element.innerHTML
    html = reverseSanitation(html)
    html = compileHTMLExpression(html)

    element.initialContent = html

    element.setInnerHTML = (inner) => {
        element.innerHTML = inner
        compile(element, id)
    }

    const uid = "xid-" + id.join("-")
    element.classList.add(uid)

    if (element.attributes.getNamedItem("reacts-to") != null) {
        const reacts_to = element.attributes.getNamedItem("reacts-to").value
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
                    ${copy} = ${reacts_to}
                    document.querySelector('.${uid}').render()
                }
            }, 10)
        `
        body.appendChild(script)
    }

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

        scan(this, id)
    }

    element.render()
}

function scan(parent, initialId) {
    debugLog("id: " + initialId)

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
            debugLog("It is a inline javascript expression")

            let id = []
            if (initialId != null) initialId.forEach((v) => id.push(v))
            id.push(i)

            compile(element, id)
        } else if (element.attributes.getNamedItem("xsrc") != null) {
            debugLog("It contains a 'xsrc' attribute")

            const xsrc = element.attributes.getNamedItem("xsrc").value

            GET(window.location.origin + "/" + xsrc).then((res) => {
                let content = res.responseText
                content = content.split("?").join("&quest;")
                console.log(content)
                element.innerHTML = content
                console.log(element.innerHTML)

                // evaluating scripts
                element.querySelectorAll("script").forEach((v) => {
                    let script = d.createElement("script")
                    script.innerHTML = v.innerHTML
                    body.appendChild(script)
                })

                // scoping styles
                element.querySelectorAll("style").forEach((v) => {
                    v.innerHTML = "/*Hello*/ " + v.innerHTML
                })

                scan(element)
            })
        } else {
            debugLog("It is a regular element")
            scan(element)
        }
    }

    debugLog("finish scanning")
}

scan(body)
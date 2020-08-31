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
    // removes all comments
    css = css.replace(/\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/g, "")

    const regex = /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g
    let m
    let replaceList = []

    while ((m = regex.exec(css)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++
        }

        m.forEach((match, groupIndex) => {
            if (groupIndex == 0 && !match.startsWith("@")) {
                if (!replaceList.includes(match)) replaceList.push(match)
            }
        })
    }

    replaceList.forEach((replace) => {
        css = css.replace(new RegExp(replace, "g"), scope + " " + replace)
    })

    return css
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
    ${scan}
    ${compile}
    if ($__element__.innerHTML.trim().startsWith("{")) compile($__element__);
    $__element__.outerHTML
\`)
`

function compileHTMLExpression(html) {
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
    let html = element.innerHTML
    html = reverseSanitation(html)
    html = compileHTMLExpression(html)

    element.initialContent = html

    const uid = getUniqueClassName()
    element.classList.add(uid)

    compileReactsTo(element, uid)

    const attributes = Array.from(element.attributes)
    for (let j = 0; j < attributes.length; j++) {
        if (element.attributes[j] == undefined) continue
        const value = element.attributes[j].value

        if (value.trim().includes("{")) {
            let inBrackets = /\{(.*?)\}/g

            let replaceList = []

            let m
            while ((m = inBrackets.exec(value)) !== null) {
                if (m.index === inBrackets.lastIndex) {
                    inBrackets.lastIndex++
                }

                m.forEach((match, groupIndex) => {
                    if (groupIndex == 0) {
                        if (!replaceList.includes(match)) replaceList.push(match)
                    }
                })
            }

            let newValue = value
            replaceList.forEach((replace) => {
                let val = undefined

                try {
                    val = eval(replace)
                } catch (e) {
                    console.error("Can't evaluate attribute value " + replace)
                    console.error(e)
                }


                if (typeof val === "string") val = "'" + val + "'"

                newValue = newValue.split(replace).join(val)
            })

            element.attributes[j].value = newValue
        }
    }

    // element.on = function (event, f) this.setAttribute("on" + event, f.toString() + f.name + "(event)") }

    element.render = function () {
        let res = ""

        try {
            res = eval(this.initialContent)
        } catch (err) {
            console.log(this.initialContent)
            console.error(err)
        }

        if (res instanceof Array) res = res.join("")
        if (res == undefined) res = ""

        this.innerHTML = res

        scan(element, false)
    }

    element.render()
}

function scan(parent, dontCompile) {
    const childs = Array.from(parent.children)

    for (const i in childs) {
        const element = childs[i]

        // skip scripts and styles
        if (["SCRIPT", "STYLE"].includes(element.tagName)) continue

        if (element.innerHTML.trim().startsWith("{")) {
            if (dontCompile) continue

            compile(element)
        } else if (element.attributes.getNamedItem("xsrc") != null) {
            const el = d.createElement("div")
            const id = getUniqueClassName()
            el.classList.add(id)

            const xsrc = element.attributes.getNamedItem("xsrc").value

            GET(window.location.origin + "/" + xsrc).then((res) => {
                let varsList = Array.from(element.attributes)
                varsList = varsList.filter(v => !["xsrc", "id", "class"].includes(v.name))

                let vars = ""
                varsList.forEach((v) => {
                    let val = v.value

                    if (isNaN(parseInt(val))) {
                        val = JSON.stringify(val)
                    }
                    vars += "let " + v.name + "=" + val + ";"
                })

                let content = "<div>{" + vars + "(<div>" + res.responseText + "</div>)}</div>"

                if (vars !== "") {
                    console.log("RUN")
                }

                el.innerHTML = content
                element.appendChild(el)

                el.querySelectorAll("script").forEach((v) => {
                    let script = d.createElement("script")
                    script.innerHTML = v.innerHTML
                    body.appendChild(script)
                })

                el.querySelectorAll("style").forEach((v) => {
                    v.innerHTML = cssToScopedCss("." + id, v.innerHTML)
                })

                scan(element)
            })
        } else {
            const attributes = Array.from(element.attributes)
            for (let j = 0; j < attributes.length; j++) {
                if (element.attributes[j] == undefined) continue
                const value = element.attributes[j].value

                if (value.trim().includes("{")) {
                    let inBrackets = /\{(.*?)\}/g

                    let replaceList = []

                    let m
                    while ((m = inBrackets.exec(value)) !== null) {
                        if (m.index === inBrackets.lastIndex) {
                            inBrackets.lastIndex++
                        }

                        m.forEach((match, groupIndex) => {
                            if (groupIndex == 0) {
                                if (!replaceList.includes(match)) replaceList.push(match)
                            }
                        })
                    }

                    let newValue = value
                    replaceList.forEach((replace) => {
                        let val = undefined

                        try {
                            val = eval(replace)
                        } catch (e) {
                            console.error("Can't evaluate attribute value " + replace)
                            console.error(e)
                        }


                        if (typeof val === "string") val = "'" + val + "'"

                        newValue = newValue.split(replace).join(val)
                    })

                    element.attributes[j].value = newValue
                }
            }
            scan(element, dontCompile)
        }
    }
}

scan(body)
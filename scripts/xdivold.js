const d = document
const body = d.body
const head = d.head
const $ = (v) => d.querySelector(v)
const $a = (v) => d.querySelectorAll(v)
const append = (str) => body.innerHTML += str

let I = 0;

async function GET(theUrl) {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", theUrl, false)
    xmlHttp.send(null)
    return xmlHttp
}

let xdivs = {}

function convertHTMLString(script) {
    let out = ""

    let depth = 0
    for (let i = 0; i < script.length; i++) {
        const c = script.substr(i, 1)
        const cc = script.substr(i, 2)

        if (cc === "(<") {
            for (let j = 0; j < depth; j++) {
                out += "\\"
                if (j != 0) out += "\\"
            }

            out += "`<"
            i++
            depth++
        } else if (cc === ">)") {
            depth--
            out += ">"

            for (let j = 0; j < depth; j++) {
                out += "\\"
                if (j != 0) out += "\\"
            }

            out += "`"
            i++
        } else {
            out += c
        }
    }

    return out
}

async function compile(p) {
    const srcs = p.querySelectorAll("*[xsrc]")

    for (let i = 0; i < srcs.length; i++) {
        const element = srcs[i];

        const res = await GET(window.location.origin + "/" + element.attributes.getNamedItem("src").value)

        try {
            let content = res.responseText

            element.isLoader = true
            element.innerHTML = res.responseText

            element.querySelectorAll("script").forEach((v) => {
                let script = d.createElement("script")
                script.innerHTML = v.innerHTML
                body.appendChild(script)
                compile(element)
            })
        } catch {
        }
    }

    const all = p.querySelectorAll('*')

    for (let i = 0; i < all.length; i++) {
        const element = all[i];
        if (!element.innerHTML.trim().startsWith("{{")) continue

        if (element.parentElement == null) {
            console.log("has no parent element")
            console.log(element)
        }

        // sets a unique class name
        const id = `xdiv-id-${I++}`;
        element.classList.add(id);

        // sets the initial content
        const replaceList = {
            '&gt;': '>',
            '&lt;': '<',
        }
        element.initialContent = element.innerHTML
        Object.keys(replaceList).forEach((i) => {
            element.initialContent = element.initialContent.split(i).join(replaceList[i])
        })
        element.initialContent = convertHTMLString(element.initialContent)

        // sets the rerender function
        element.rerender = function () {
            let res

            try {
                res = eval(`
                const element = document.getElementsByClassName('${id}').item(0);
                let _ = '';
                ${this.initialContent}
            `);
            } catch (e) {
                console.error(e)
                console.log(this.initialContent)
                res = ""
            }

            if (res instanceof Array) res = res.join("")
            if (res == undefined) res = ""

            this.innerHTML = res

            compile(this)

            return this.innerHTML
        };

        element.rerender();

        // add the element to the x array
        xdivs[element.id] = element
        // console.log(element)
    }
}

compile(document.body)
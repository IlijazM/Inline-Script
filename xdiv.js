const d = document
const body = d.body
const head = d.head
const $ = (v) => d.querySelector(v)
const $a = (v) => d.querySelectorAll(v)
const append = (str) => body.innerHTML += str

let I = 0;

async function GET(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp;
}

async function loadFile(element, fileName) {
    const res = await GET(window.location.origin + "/" + fileName)
    element.innerHTML = res.responseText
}

let xdivs = {}

async function compile(p) {
    const all = p.querySelectorAll('*[x]')

    for (let i = 0; i < all.length; i++) {
        const element = all[i];
        if (element.parentElement == null) {
            console.log("has no parent element")
            console.log(element)
        }

        if (element.attributes.getNamedItem("src") != null) {
            const res = await GET(window.location.origin + "/" + element.attributes.getNamedItem("src").value)

            try {
                element.isLoader = true
                element.innerHTML = res.responseText

                element.querySelectorAll("script").forEach((v) => {
                    let script = d.createElement("script")
                    script.innerHTML = v.innerHTML
                    body.appendChild(script)
                })
            } catch {
            }
        }

        // sets a unique class name
        const id = `xdiv-id-${I++}`;
        element.classList.add(id);

        if (element.isLoader) {
            compile(element)
            continue
        }

        // sets the initial content
        const replaceList = {
            '&gt;': '>',
            '&lt;': '<',
            '(<': '`<',
            '>)': '>`',
        }
        element.initialContent = element.innerHTML
        Object.keys(replaceList).forEach((i) => {
            element.initialContent = element.initialContent.split(i).join(replaceList[i])
        })

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
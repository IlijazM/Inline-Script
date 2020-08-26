const d = document
const body = d.body
const head = d.head
const $ = (v) => d.querySelector(v)
const $a = (v) => d.querySelectorAll(v)
const append = (str) => body.innerHTML += str

let xdivs = {}

function compile(p) {
    const all = p.querySelectorAll('xdiv')

    for (let i = 0; i < all.length; i++) {
        const element = all[i];
        if (element.parentElement == null) {
            console.log(element + " has no parent element")
            continue
        }

        // sets a unique class name
        const id = `xdiv-id-${i}`;
        element.classList.add(id);

        // change the outer html from xdiv to div
        // element.outerHTML = `<div${element.outerHTML.substring(5, element.outerHTML.length - 5)}div>`

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
            } catch {
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
        console.log(element)
    }
}

compile(document.body)
function load(element) {
    setTimeout(() => {
        element.innerHTML = 10
    }, 1000)

    return "loading..."
}

let InlineScriptUID = 0
const UIDPrefix = "inline-script-uid-"
function newUID() { return InlineScriptUID++ }

function setUniqueClassName(element) {
    element.classList.add(UIDPrefix + element.uid)
}

function hasInlineScript(element) {
    if (element.tagName === "SCRIPT" || element.tagNAME === "STYLE") return false
    return element.innerHTML.trim().startsWith("{")
}

function scan(element, compile) {
    setUniqueClassName(element)

    if (hasInlineScript(element)) {
        element.inlineScript = element.innerHTML
        compile(element)
    } else {
        scanChildren(element, (child) => {
            scan(child, compile)
        })
    }
}

function scanChildren(element, callback) {
    Array.from(element.children).forEach(v => callback(v))
}

scan(document.body, () => { })

{
    let b = 100..random
    document.querySelectorAll('.' + hasInlineScriptClassName).forEach(v => {
        eval(render + "render(v)")
    })
}

document.body.classList.remove("invisible")
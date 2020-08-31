function scope(scope, css) {
    css = css.replace(/\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/g, "")

    const regex = /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g
    let m
    let replaceList = []

    while ((m = regex.exec(css)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++
        }

        m.forEach((match, groupIndex) => {
            match = match.trim()
            if (groupIndex == 0 && !match.startsWith("@") && !match.startsWith("from") && !match.startsWith("to") && !/[0-9]/.test(match.substr(0, 1))) {
                if (!replaceList.includes(match)) replaceList.push(match)
            }
        })
    }

    replaceList.forEach((replace) => {
        css = css.replace(new RegExp(replace, "g"), scope + " " + replace)
    })

    return css
}

let SCOPEDCSSID = 0
function getUniqueStyleId() { return "scoped-css-id-" + SCOPEDCSSID++ }

function scopeStyles(element) {
    let styles = Array.from(element.querySelectorAll("style[scoped]"))

    styles.forEach((styleElement) => {
        const parentElement = styleElement.parentElement
        const parentClass = getUniqueStyleId()
        parentElement.classList.add(parentClass)

        const style = scope("." + parentClass, styleElement.innerHTML)
        styleElement.innerHTML = style
        styleElement.removeAttribute("scoped")
    })

    styles = Array.from(element.querySelectorAll("style[scope]"))

    styles.forEach((styleElement) => {
        const style = scope(styleElement.attributes.getNamedItem("scope").value, styleElement.innerHTML)
        styleElement.innerHTML = style
        styleElement.removeAttribute("scope")
    })
}

function scopeAllStyles() { scopeStyles(document.querySelector("html")) }

scopeAllStyles()
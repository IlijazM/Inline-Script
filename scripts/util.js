//#region HTMLElement
Object.defineProperty(Element.prototype, 'html', {
    get: function () { return this.innerHTML },
    set: function (value) { this.innerHTML = value }
});

Object.defineProperty(Element.prototype, 'x', {
    get: function () { return this.getBoundingClientRect().x },
});

Object.defineProperty(Element.prototype, 'y', {
    get: function () { return this.getBoundingClientRect().y },
});

Object.defineProperty(Element.prototype, 'width', {
    get: function () { return this.getBoundingClientRect().width },
});

Object.defineProperty(Element.prototype, 'height', {
    get: function () { return this.getBoundingClientRect().height },
});

Element.prototype.addClass = function (className) {
    this.classList.add(className)
}

Element.prototype.removeClass = function (className) {
    this.classList.remove(className)
}

Element.prototype.toggleClass = function (className) {
    this.classList.toggle(className)
}

Element.prototype.containsClass = function (className) {
    this.classList.contains(className)
}

Element.prototype.addClass = function (className) {
    this.classList.add(className)
}


//#endregion

//#region Number
Number.prototype.for = function (fun, steps) {
    if (steps === undefined) steps = 1
    if (steps === 0) return
    if (steps > 0) {
        for (let i = 0; i < Math.abs(this); i += steps) fun(i)
    } else {
        for (let i = 0; i > -Math.abs(this); i += steps) fun(i)
    }
}

Number.prototype.do = function (res, fun, steps) {
    if (steps === undefined) steps = 1
    for (let i = 0; i < this; i += steps) {
        res += fun(i)
    }
    return res
}

Number.prototype.map = function (fun, steps) {
    let res = []
    if (steps === undefined) steps = 1
    for (let i = 0; i < this; i += steps) {
        res.push(fun(i))
    }
    return res
}
//#endregion

//#region Array
Object.defineProperty(Array.prototype, 'first', {
    get: function () { return this[0] },
})

Object.defineProperty(Array.prototype, 'last', {
    get: function () { return this[this.length - 1] },
})

Object.defineProperty(Array.prototype, 'random', {
    get: function () { return this[Math.floor(Math.random() * this.length)] },
})

Array.prototype.do = function (res, fun) {
    this.forEach(v => {
        res += fun(v)
    })
    return res
}
//#endregion

//#region String
String.prototype.toElement = function () {
    const el = document.createElement("div")
    el.innerHTML = this
    return el.firstChild
}

String.prototype.test = function () { return "Hello, world!" }
//#endregion
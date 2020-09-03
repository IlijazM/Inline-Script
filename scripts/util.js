const clog = console.log
const cerr = console.error

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

const query = function (selector) { return document.querySelector(selector) }
const queryAll = function (selector) { return Array.from(document.querySelectorAll(selector)) }
//#endregion

//#region for
Number.prototype.for = function (fun, steps) {
    if (steps === undefined) steps = 1
    if (steps === 0) return
    if (steps > 0) {
        for (let i = 0; i < Math.abs(this); i += steps) fun(i)
    } else {
        for (let i = 0; i > -Math.abs(this); i += steps) fun(i)
    }
}
//#endregion

//#region do
Number.prototype.do = function (res, fun, steps) {
    if (steps === undefined) steps = 1
    for (let i = 0; i < this; i += steps) {
        res += fun(i)
    }
    return res
}

Array.prototype.do = function (res, fun) {
    this.forEach(v => {
        res += fun(v)
    })
    return res
}

String.prototype.do = function (res, fun) {
    return this.split("").do(res, fun)
}
//#endregion

//#region map
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
Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item)
    return this
}

Object.defineProperty(Array.prototype, 'first', {
    get: function () { return this[0] },
})

Object.defineProperty(Array.prototype, 'last', {
    get: function () { return this[this.length - 1] },
})

Array.prototype.copyFrom = function (source) {
    for (var i = 0; i < source.length; i++) {
        this[i] = source[i]
    }
    this.length = source.length
    return this
}
//#endregion

//#region String
String.prototype.toElement = function () {
    const el = document.createElement("div")
    el.innerHTML = this
    return el.firstChild
}
//#endregion

//#region as/to Array/String
String.prototype.toArray = function () {
    return this.split("")
}

Object.defineProperty(String.prototype, 'asArray', {
    get: function () { return this.split("") },
})

Object.defineProperty(Array.prototype, 'asString', {
    get: function () { return this.join("") },
    set: function (value) { this.copyFrom(value.asArray) }
})
//#endregion

//#region random
Object.defineProperty(Number.prototype, 'random', {
    get: function () { return Math.floor(Math.random() * this) },
})

Object.defineProperty(Array.prototype, 'random', {
    get: function () { return this[Math.floor(Math.random() * this.length)] },
})

Object.defineProperty(String.prototype, 'random', {
    get: function () { let array = this.split(""); return array[Math.floor(Math.random() * array.length)] },
})

// Object.defineProperty(Object.prototype, 'random', {
//     get: function () { return Object.entries(this).random },
// })
//#endregion

Number.prototype.increment = function () { return this + 1 }

Object.defineProperty(Array.prototype, 'test.a', {
    get: function () { return this }
})

String.prototype.test = function () { clog("test") }
const productName = 'Inline-script.js'

let preUrl = ''
if (document.location.host === "ilijazm.github.io") {
    preUrl = '/Inline-Script'
}

const navigation = [
    { url: preUrl + '/index.html', altUrl: '/', name: 'Home' },
    { url: preUrl + '/showcase.html', name: 'Showcase' },
    { url: preUrl + '/learn.html', name: 'Learn' },
    { url: preUrl + '/documentation.html', name: 'Documentation' },
]

const learnPages = [
    { url: preUrl + '/learn.html', name: 'Introduction' },
    { url: preUrl + '/learn/inline-script-syntax.html', name: 'Inline Script Syntax' },
    { url: preUrl + '/learn/updating-an-element.html', name: 'Updating an element' },
]
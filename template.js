const fs = require('fs')

async function generate(pathName) {
    const routes = JSON.parse(fs.readFileSync('routes.json', 'utf-8'))
    const template = fs.readFileSync('template.html', 'utf-8')

    fs.mkdir('docs', { recursive: true }, (err) => {
        if (err) throw err
    })

    routes.forEach(route => generateFiles(route, template, pathName))
}

function generateFiles(route, template, pathName) {
    let html = template
        .replace(/\$globalPath/gm, pathName)
        .replace(/\$localPath/gm, pathName + route.url)

    fs.mkdirSync('docs' + route.url, { recursive: true }, (err) => {
        if (err) throw err
    })

    fs.writeFile('docs' + route.url + '/index.html', html, (err) => { })
    fs.writeFile('docs' + route.url + '/body.html', '<div></div>', { flag: 'wx' }, (err) => { })
    fs.writeFile('docs' + route.url + '/head.html', '<div>\n    <title>Inline Script - ' + route.name + '</title>\n</div>', { flag: 'wx' }, (err) => { })

    if (route.subPaths !== undefined) {
        route.subPaths.forEach(route => generateFiles(route, template, pathName))
    }
}

module.exports = {
    generate: generate
}
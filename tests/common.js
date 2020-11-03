"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocument = exports.runScript = exports.runJSDOM = exports.getJSDOMOptions = exports.writeHTML = exports.readTemplate = exports.writeFile = exports.getTestDirName = exports.getDirName = exports.getPathName = exports.sleep = exports.html = void 0;
const fs = require("fs");
const Path = require("path");
const jsdom = require("jsdom");
const vm = require("vm");
let dom;
console.error = (err) => {
    throw err;
};
exports.html = (str) => str[0];
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    });
}
exports.sleep = sleep;
function getPathName() {
    return jasmine['testPath'];
}
exports.getPathName = getPathName;
function getDirName() {
    return Path.dirname(getPathName());
}
exports.getDirName = getDirName;
function getTestDirName() {
    return 'tests';
}
exports.getTestDirName = getTestDirName;
function writeFile(path, content) {
    fs.writeFileSync(Path.join(getDirName(), path), content);
}
exports.writeFile = writeFile;
function readTemplate() {
    return fs.readFileSync(Path.join(getTestDirName(), 'template.html'), 'utf-8');
}
exports.readTemplate = readTemplate;
function writeHTML(path, content) {
    let template = readTemplate();
    template = template.replace(/\%html\%/, content);
    writeFile(path, template);
}
exports.writeHTML = writeHTML;
function getJSDOMOptions() {
    return {};
}
exports.getJSDOMOptions = getJSDOMOptions;
function runJSDOM(path = 'index.html') {
    return __awaiter(this, void 0, void 0, function* () {
        const filePath = Path.join(getDirName(), path);
        dom = yield jsdom.JSDOM.fromFile(filePath, {
            resources: 'usable',
            runScripts: 'dangerously',
            pretendToBeVisual: true,
        });
        yield sleep(10);
        runScript(dom, `inlineScript();`);
        yield sleep(200);
    });
}
exports.runJSDOM = runJSDOM;
function runScript(dom, script) {
    new vm.Script(script).runInContext(dom.getInternalVMContext());
}
exports.runScript = runScript;
function getDocument() {
    return dom.window.document;
}
exports.getDocument = getDocument;

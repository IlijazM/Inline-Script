import * as fs from 'fs';
import * as Path from 'path';
import * as jsdom from 'jsdom';
import * as vm from 'vm';

let dom: jsdom.JSDOM;

console.error = (err: any) => {
  throw err;
};

export const html = (str: any) => str[0];

/**
 * Sleeps for 'ms' milliseconds.
 *
 * @param ms the timeout in milliseconds.
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @returns the path of the test file.
 */
export function getPathName() {
  return jasmine['testPath'];
}

/**
 * @returns the directory of the test file.
 */
export function getDirName() {
  return Path.dirname(getPathName());
}

/**
 * @returns the directory of all test files.
 */
export function getTestDirName() {
  return 'tests';
}

/**
 * Simply writes a file.
 *
 * @param path the relative path to the file.
 * @param content the content of the file in utf-8.
 */
export function writeFile(path: string, content: string) {
  fs.writeFileSync(Path.join(getDirName(), path), content);
}

export function readTemplate(): string {
  return fs.readFileSync(Path.join(getTestDirName(), 'template.html'), 'utf-8');
}

/**
 * Takes the 'template.html' and replaces the content with the %html% placeholder.
 *
 * @param path the relative path to the file.
 * @param content the content of the %html% placeholder in utf-8.
 */
export function writeHTML(path: string, content: string) {
  let template = readTemplate();
  template = template.replace(/\%html\%/, content);
  writeFile(path, template);
}

/**
 * @returns a default jsdom options object.
 */
export function getJSDOMOptions(): Record<string, any> {
  return {};
}

/**
 * Runs JSDOM on a file.
 *
 * @param path the relative path to the file. Its default is 'index.html'.
 *
 * @throws an exception whenever some error got printed in the console.
 */
export async function runJSDOM(path: string = 'index.html') {
  const filePath = Path.join(getDirName(), path);

  dom = await jsdom.JSDOM.fromFile(filePath, {
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });

  await sleep(10);
  runScript(dom, `inlineScript();`);

  await sleep(200);
}

/**
 * Runs a script on a virtual dom.
 */
export function runScript(dom: jsdom.JSDOM, script: string) {
  new vm.Script(script).runInContext(dom.getInternalVMContext());
}

/**
 * Returns the document of the jsdom
 */
export function getDocument(): HTMLDocument {
  return dom.window.document;
}

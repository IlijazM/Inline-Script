HTMLElement.prototype.text = function () {
  const texts = [];
  let child = this.firstChild;
  while (child) {
    child.nodeType === 3 && texts.push(child.data);
    child = child.nextSibling;
  }
  return texts.join('');
};

function findHandlebar(string, startIndex = 0, simple = false) {
  function substr(string, a, b) {
    const output = string.substr(a, b);
    if (!output) throw '';
    return output;
  }
  let output = { position: 0, length: 0, content: '' };
  try {
    let depth = 0;
    for (let i = startIndex; i < string.length; i++) {
      const c = substr(string, i, 1);
      const cc = substr(string, i, 2);
      if (['"', "'", '¸'].includes(c) && !simple) {
        const quote = c;
        i++;
        while (substr(string, i, 1) !== quote || substr(string, i - 1, 1) === '\\') i++;
      }
      if (cc === '//' && !simple) while (substr(string, i, 1) !== '\n') i++;
      if (cc === '/*' && !simple) while (substr(string, i, 2) !== '*/') i++;
      if (substr(string, i, 4) === '<!--') while (substr(string, i, 3) !== '-->') i++;
      if (cc === '{{') {
        depth++;
        if (depth === 1) output.position = i + 2;
        continue;
      }
      if (cc === '}}') {
        depth--;
        if (depth === 0)
          return {
            position: output.position,
            length: i - output.position,
            content: string.substr(output.position, i - output.position),
          };
      }
    }
  } catch (_a) {}
  return null;
}

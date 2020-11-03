/**
 * This test will check if the html syntax is working.
 */

import * as common from '../common';

test('Scoping variables', async () => {
  common.writeHTML(
    'index.html',
    common.html`<div>{{ const foo = 'foo'; (<div>{ const bar = 'bar'; (<h1>{ foo + bar }</h1>) }</div>) }}</div>`
  );
  await common.runJSDOM();

  expect(common.getDocument().querySelector('h1').innerHTML).toEqual('foobar');
});

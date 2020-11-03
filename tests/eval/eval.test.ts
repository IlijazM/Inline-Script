/**
 * This test will check if the inline script syntax is able to handle
 * a more complex script.
 */

import * as common from '../common';

test('Eval', async () => {
  common.writeHTML('index.html', common.html`<h1>{{ let a = 10; let b = 20; a + b }}</h1>`);
  await common.runJSDOM();

  expect(common.getDocument().querySelector('h1').innerHTML).toEqual('30');
});

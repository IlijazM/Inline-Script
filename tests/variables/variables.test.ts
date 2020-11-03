/**
 * This test will check if a variable is available in the inline script syntax.
 */

import * as common from '../common';

test('Variable', async () => {
  common.writeHTML('index.html', common.html`<h1>{{ document.title }}</h1>`);
  await common.runJSDOM();

  expect(common.getDocument().querySelector('h1').innerHTML).toEqual('Title');
});

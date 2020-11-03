/**
 * This test will check if the html syntax is working.
 */

import * as common from '../common';

test('HTML syntax', async () => {
  common.writeHTML('index.html', common.html`<div>{{ (<h1>hello, world!</h1>) }}</div>`);
  await common.runJSDOM();

  expect(common.getDocument().querySelector('div').innerHTML).toEqual('<h1>hello, world!</h1>');
});

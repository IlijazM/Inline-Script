/**
 * This test will make sure inline script will at least start.
 */

import * as common from '../common';

test('Starting', async () => {
  common.writeHTML('index.html', ``);
  await common.runJSDOM();

  expect(true).toBe(true);
});

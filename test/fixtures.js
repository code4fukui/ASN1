/* global describe it */

import { assert } from "https://code4fukui.github.io/describe/describe.js";

export function jsonEqual(a, b) {
  assert.deepEqual(JSON.parse(JSON.stringify(a)),
                   JSON.parse(JSON.stringify(b)));
};

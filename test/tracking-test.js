/* global describe it */

import { assert, describe, it } from "https://code4fukui.github.io/describe/describe.js";
import * as asn1 from "../lib/asn1.js";
import { jsonEqual } from "./fixtures.js";

describe('asn1.js tracking', function() {
  it('should track nested offsets', () => {
    const B = asn1.define('B', function() {
      this.seq().obj(
        this.key('x').int(),
        this.key('y').int()
      );
    });

    const A = asn1.define('A', function() {
      this.seq().obj(
        this.key('a').explicit(0).use(B),
        this.key('b').use(B)
      );
    });

    const input = {
      a: { x: 1, y: 2 },
      b: { x: 3, y: 4 }
    };

    const tracked = [];

    const encoded = A.encode(input, 'der');
    const decoded = A.decode(encoded, 'der', {
      track: function(path, start, end, type) {
        tracked.push([ type, path, start, end ]);
      }
    });

    jsonEqual(input, decoded);
    assert.deepEqual(tracked, [
      [ "tagged", "", 0, 20 ],
      [ "content", "", 2, 20 ],
      [ "tagged", "a", 4, 12 ],
      [ "content", "a", 6, 12 ],
      [ "tagged", "a/x", 6, 9 ],
      [ "content", "a/x", 8, 9 ],
      [ "tagged", "a/y", 9, 12 ],
      [ "content", "a/y", 11, 12 ],
      [ "tagged", "b", 12, 20 ],
      [ "content", "b", 14, 20 ],
      [ "tagged", "b/x", 14, 17 ],
      [ "content", "b/x", 16, 17 ],
      [ "tagged", "b/y", 17, 20 ],
      [ "content", "b/y", 19, 20 ]
    ]);
  });
});

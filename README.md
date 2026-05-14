# ASN1.js

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

ASN.1 DER/PEM Encoder/Decoder with a fluent DSL for modern JavaScript environments (Deno, browsers, Node.js).

## Example

Define a schema, encode a JavaScript object, and decode it back.

**1. Define the model:**

```javascript
import * as asn from "https://code4fukui.github.io/ASN1/lib/asn1.js";

const Bio = asn.define('Bio', function() {
  this.seq().obj(
    this.key('time').gentime(),
    this.key('description').octstr()
  );
});

const Human = asn.define('Human', function() {
  this.seq().obj(
    this.key('firstName').octstr(),
    this.key('lastName').octstr(),
    this.key('age').int(),
    this.key('gender').enum({ 0: 'male', 1: 'female' }),
    this.key('bio').seqof(Bio)
  );
});
```

**2. Encode data to DER format:**

```javascript
const output = Human.encode({
  firstName: 'Thomas',
  lastName: 'Anderson',
  age: 28,
  gender: 'male',
  bio: [
    {
      time: +new Date('31 March 1999'),
      description: 'freedom of mind'
    }
  ]
}, 'der');
```

**3. Decode the DER buffer:**

```javascript
const human = Human.decode(output, 'der');
console.log(human);
/*
{
  firstName: <Buffer 54 68 6f 6d 61 73>,
  lastName: <Buffer 41 6e 64 65 72 73 6f 6e>,
  age: 28,
  gender: 'male',
  bio: [
    {
      time: 922820400000,
      description: <Buffer 66 72 65 65 64 6f 6d 20 6f 66 20 6d 69 6e 64>
    }
  ]
}
*/
```

## Features

*   **Declarative DSL:** Define complex ASN.1 structures with a simple, chained API.
*   **Multiple Encodings:** Supports both DER (Distinguished Encoding Rules) and PEM encoding/decoding.
*   **Rich Type Support:** Includes `seq`, `seqof`, `set`, `int`, `enum`, `octstr`, `bitstr`, `gentime`, `utctime`, `objid`, and more.
*   **Robust Error Handling:** Perform partial decoding to parse data without stopping on the first error.
*   **RFC Implementations:** Provides pre-defined structures for [RFC 5280 (X.509 Certificates)](rfc/5280) and [RFC 2560 (OCSP)](rfc/2560).

### Partial Decoding

To parse data without stopping on the first error, use the `{ partial: true }` option. The result will be an object containing the partially decoded `result` and an array of `errors`.

```javascript
const data = Human.decode(output, 'der', { partial: true });
console.log(data);
/*
{
  result: { ... },
  errors: [ ... ]
}
*/
```

## Acknowledgements

This project is a fork of the original [asn1.js by Fedor Indutny](https://github.com/indutny/asn1.js), adapted for modern ES Module environments.

## License

MIT License — see [LICENSE](LICENSE).
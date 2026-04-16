# ASN1.js

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

An ASN.1 encoder and decoder for JavaScript, featuring a DSL for defining data structures. ASN.1 is a standard for defining data structures, commonly used in cryptography and telecommunications.

## Features

*   **DSL:** Define complex ASN.1 models using a simple JavaScript DSL.
*   **Encoding/Decoding:** Supports both DER (Distinguished Encoding Rules) and PEM encoding formats.
*   **Rich Type Support:** Handles a wide range of ASN.1 types, including `SEQUENCE`, `CHOICE`, `INTEGER`, `OCTET STRING`, `OBJECT IDENTIFIER`, `UTCTime`, and more.
*   **Error Handling:** Provides detailed error reporting with path tracking to pinpoint issues in your data.
*   **Partial Decoding:** Parse data without stopping on the first error, returning both the partial result and a list of errors.
*   **Offset Tracking:** An optional callback can track the start and end offsets of each decoded element.
*   **RFC Structures:** Includes pre-defined structures for RFC 5280 (X.509 Certificates) and RFC 2560 (OCSP).

## Usage

### 1. Define a Model

Use the `asn.define` method to create models for your data structures.

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

### 2. Encode Data

Use the `.encode()` method on your model to serialize a JavaScript object into DER or PEM format.

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

### 3. Decode Data

Use the `.decode()` method to parse binary ASN.1 data back into a JavaScript object.

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

## Advanced Usage

### Partial Decode

You can parse data without stopping on the first error by setting the `partial` option to `true`. The decoder will return an object containing the partially decoded `result` and an array of `errors`.

```javascript
const human = Human.decode(output, 'der', { partial: true });
console.log(human);
/*
{
  result: { ... },
  errors: [ ... ]
}
*/
```

### Offset Tracking

To get the position of each decoded element, provide a `track` callback function in the options. The callback will be invoked for each element with its path, start offset, end offset, and type.

```javascript
const tracked = [];
const decoded = A.decode(encoded, 'der', {
  track: function(path, start, end, type) {
    tracked.push([ type, path, start, end ]);
  }
});
```

## License

MIT License — see [LICENSE](LICENSE).
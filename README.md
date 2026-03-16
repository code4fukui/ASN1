# ASN1.js

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

ASN.1 DER Encoder/Decoder and DSL.

## Example

Define model:

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

Encode data:

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

Decode data:

```javascript
const human = Human.decode(output, 'der');
console.log(human);
```

### Partial decode

It's possible to parse data without stopping on the first error. To do this, call:

```javascript
const human = Human.decode(output, 'der', { partial: true });
console.log(human);
```

## License

MIT License — see [LICENSE](LICENSE).
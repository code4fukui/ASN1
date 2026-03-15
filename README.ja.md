# ASN1.js

ASN.1 DER Encoder/DecoderとDSL。

## デモ

モデルの定義:

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

データのエンコード:

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

データのデコード:

```javascript
const human = Human.decode(output, 'der');
console.log(human);
/*
{ firstName: <Buffer 54 68 6f 6d 61 73>,
  lastName: <Buffer 41 6e 64 65 72 73 6f 6e>,
  age: 28,
  gender: 'male',
  bio:
   [ { time: 922820400000,
       description: <Buffer 66 72 65 65 64 6f 6d 20 6f 66 20 6d 69 6e 64> } ] }
*/
```

### 部分的なデコード

最初のエラーで停止することなく、データをパースすることができます。このためには以下のように呼び出します。

```javascript
const human = Human.decode(output, 'der', { partial: true });
console.log(human);
/*
{ result: { ... },
  errors: [ ... ] }
*/
```

## ライセンス

このソフトウェアはMITライセンスの下にあります。

Copyright Fedor Indutny, 2017.
# ASN1.js

ASN.1 DER Encoder/DecoderとDSL。ASN.1はデータ構造定義の標準フォーマットで、このライブラリではそのエンコーディングとデコーディング、およびDSLを提供しています。

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
```

### 部分的なデコード

最初のエラーで停止することなく、データをパースすることができます。このためには以下のように呼び出します。

```javascript
const human = Human.decode(output, 'der', { partial: true });
console.log(human);
```

## ライセンス

このソフトウェアはMITライセンスの下にあります。

Copyright Fedor Indutny, 2017.
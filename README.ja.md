# ASN1.js

ASN.1のDER (Distinguished Encoding Rules) およびPEM (Privacy-Enhanced Mail) 形式に対応した、JavaScript製のエンコーダー/デコーダーライブラリです。データ構造を定義するためのDSL（ドメイン固有言語）も提供しており、複雑なデータ構造も直感的に扱うことができます。

## 機能

*   **ASN.1 DSL**: JavaScriptコードで直感的にASN.1データモデルを定義できます。
*   **DER/PEMエンコード・デコード**: 標準的なDER形式と、Base64でエンコードされたPEM形式の両方をサポートします。
*   **柔軟なデータ型**: `INTEGER`, `OCTET STRING`, `OBJECT IDENTIFIER`, `SEQUENCE`, `CHOICE`, `UTCTime`など、豊富なASN.1データ型に対応しています。
*   **部分デコード**: データにエラーが含まれていても、解析を中断せずに部分的な結果とエラーリストを取得できます。
*   **位置追跡**: デコード時に各データ要素のバッファ内での位置（オフセット）を追跡するコールバック機能を提供します。
*   **RFCサポート**: X.509 (RFC 5280) や OCSP (RFC 2560) のための構造定義も含まれています。

## 使い方

### モデルの定義

まず、ASN.1のデータ構造をDSLで定義します。

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

### データのエンコード (DER)

定義したモデルを使って、JavaScriptオブジェクトをDER形式のバイナリデータにエンコードします。

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

### データのデコード (DER)

エンコードされたデータをデコードして、元のJavaScriptオブジェクトを復元します。

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

### PEM形式でのエンコード・デコード

このライブラリは、証明書などで一般的に使用されるPEM形式もサポートしています。

```javascript
// PEM形式でエンコード
const pemOutput = Human.encode({
  firstName: 'Thomas',
  lastName: 'Anderson',
  age: 28,
  gender: 'male',
  bio: []
}, 'pem', {
  label: 'HUMAN'
});
console.log(pemOutput);
/*
-----BEGIN HUMAN-----
MCIwFAoGVGhvbWFzCghBbmRlcnNvbgIBHAwGbWFsZTAA
-----END HUMAN-----
*/

// PEM形式からデコード
const decodedFromPem = Human.decode(pemOutput, 'pem', { label: 'HUMAN' });
console.log(decodedFromPem.age); // 28
```

### 部分的なデコード

データにエラーが含まれている場合でも、パースを中断せずに処理を続けることができます。`partial: true`オプションを指定すると、デコードできた部分の結果とエラーのリストが返されます。

```javascript
const human = Human.decode(output, 'der', { partial: true });
console.log(human);
/*
{
  result: { ... }, // デコードできた部分の結果
  errors: [ ... ]  // 発生したエラーのリスト
}
*/
```

### 位置の追跡

デコード中に各要素がバッファのどの位置にあるかを追跡したい場合、`track`コールバック関数をオプションで渡すことができます。

```javascript
const tracked = [];
const decoded = Human.decode(output, 'der', {
  track: function(path, start, end, type) {
    tracked.push([ type, path, start, end ]);
  }
});

console.log(tracked);
/*
[
  [ 'tagged', '', 0, 66 ],
  [ 'content', '', 2, 66 ],
  [ 'tagged', 'firstName', 2, 10 ],
  ...
]
*/
```

## ライセンス

MITライセンス — [LICENSE](LICENSE) を参照してください。
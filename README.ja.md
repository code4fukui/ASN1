# ASN1.js

モダンなJavaScript環境（Deno、ブラウザ、Node.js）向けの、直感的なDSLを備えたASN.1 DER/PEMエンコーダ/デコーダです。

## 使用例

スキーマを定義してJavaScriptオブジェクトをエンコードし、それを再びデコードします。

**1. モデルの定義:**

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

**2. データをDER形式にエンコード:**

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

**3. DERバッファのデコード:**

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

## 特徴

*   **宣言的DSL:** シンプルなメソッドチェーンAPIを使用して、複雑なASN.1構造を定義できます。
*   **複数のエンコーディング:** DER（Distinguished Encoding Rules）およびPEMのエンコード/デコードをサポートしています。
*   **豊富な型サポート:** `seq`、`seqof`、`set`、`int`、`enum`、`octstr`、`bitstr`、`gentime`、`utctime`、`objid` などをサポートしています。
*   **堅牢なエラーハンドリング:** 最初のエラーで停止することなく、データをパースするための部分的なデコードが可能です。
*   **RFC実装:** [RFC 5280 (X.509 Certificates)](rfc/5280) および [RFC 2560 (OCSP)](rfc/2560) 用の定義済み構造を提供しています。

### 部分的なデコード

最初のエラーで停止せずにデータをパースするには、`{ partial: true }` オプションを使用します。結果は、部分的にデコードされた `result` と `errors` の配列を含むオブジェクトになります。

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

## 謝辞

本プロジェクトは、Fedor Indutny氏によるオリジナルの [asn1.js](https://github.com/indutny/asn1.js) をフォークし、モダンなES Module環境向けに適合させたものです。

## ライセンス

MIT License — 詳細は [LICENSE](LICENSE) を参照してください。

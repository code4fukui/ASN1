import { encoders } from "./encoders/index.js";
import { decoders } from "./decoders/index.js";
//import { inherits } from "https://code4fukui.github.io/inherits/inherits.js";

export function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      console.log("CC", ctor, superCtor, superCtor.prototype);
      ctor.prototype = Object.create(superCtor, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };

console.log("encoders", encoders);

export function define(name, body) {
  return new Entity(name, body);
};

function Entity(name, body) {
  this.name = name;
  this.body = body;

  this.decoders = {};
  this.encoders = {};
}

Entity.prototype._createNamed = function createNamed(Base) {
  console.log("BASE", Base)
  const name = this.name;

  function Generated(entity) {
    this._initNamed(entity, name);
  }
  console.log(Generated, Base);
  inherits(Generated, Base);
  Generated.prototype._initNamed = function _initNamed(entity, name) {
    Base.call(this, entity, name);
  };

  return new Generated(this);
};

Entity.prototype._getDecoder = function _getDecoder(enc) {
  enc = enc || 'der';
  // Lazily create decoder
  if (!this.decoders.hasOwnProperty(enc))
    this.decoders[enc] = this._createNamed(decoders[enc]);
  return this.decoders[enc];
};

Entity.prototype.decode = function decode(data, enc, options) {
  return this._getDecoder(enc).decode(data, options);
};

Entity.prototype._getEncoder = function _getEncoder(enc) {
  enc = enc || 'der';
  // Lazily create encoder
  if (!this.encoders.hasOwnProperty(enc))
    this.encoders[enc] = this._createNamed(encoders[enc]);
  return this.encoders[enc];
};

Entity.prototype.encode = function encode(data, enc, /* internal */ reporter) {
  return this._getEncoder(enc).encode(data, reporter);
};

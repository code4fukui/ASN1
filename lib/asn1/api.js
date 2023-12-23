import { createEncoder } from "./encoders/index.js";
import { createDecoder } from "./decoders/index.js";

export function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };

//console.log("encoders", encoders);

export function define(name, body) {
  return new Entity(name, body);
};

function Entity(name, body) {
  this.name = name;
  this.body = body;

  this.decoders = {};
  this.encoders = {};
}

Entity.prototype._getDecoder = function _getDecoder(enc) {
  enc = enc || 'der';
  // Lazily create decoder
  if (!this.decoders.hasOwnProperty(enc)) {
    //this.decoders[enc] = this._createNamed(decoders[enc]);
    this.decoders[enc] = createDecoder(enc, this);
  }
  return this.decoders[enc];
};

Entity.prototype.decode = function decode(data, enc, options) {
  return this._getDecoder(enc).decode(data, options);
};

Entity.prototype._getEncoder = function _getEncoder(enc) {
  enc = enc || 'der';
  // Lazily create encoder
  if (!this.encoders.hasOwnProperty(enc)) {
    //console.log(enc, encoders[enc]);
    //this.encoders[enc] = encoders[enc];//this._createNamed(encoders[enc]);
    this.encoders[enc] = createEncoder(enc, this);
  }
  return this.encoders[enc];
};

Entity.prototype.encode = function encode(data, enc, /* internal */ reporter) {
  return this._getEncoder(enc).encode(data, reporter);
};

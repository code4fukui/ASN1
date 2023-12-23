import { Reporter } from "../base/reporter.js";
import { Buffer } from "https://code4fukui.github.io/safer-buffer/safer.js";

export class DecoderBuffer extends Reporter {
  constructor(base, options) {
    super(options);
    if (!Buffer.isBuffer(base)) {
      this.error('Input not Buffer');
      return;
    }

    this.base = base;
    this.offset = 0;
    this.length = base.length;
  }

  static isDecoderBuffer(data) {
    if (data instanceof DecoderBuffer) {
      return true;
    }

    // Or accept compatible API
    const isCompatible = typeof data === 'object' &&
      Buffer.isBuffer(data.base) &&
      data.constructor.name === 'DecoderBuffer' &&
      typeof data.offset === 'number' &&
      typeof data.length === 'number' &&
      typeof data.save === 'function' &&
      typeof data.restore === 'function' &&
      typeof data.isEmpty === 'function' &&
      typeof data.readUInt8 === 'function' &&
      typeof data.skip === 'function' &&
      typeof data.raw === 'function';

    return isCompatible;
  };

  save() {
    return { offset: this.offset, reporter: Reporter.prototype.save.call(this) };
  };

  restore(save) {
    // Return skipped data
    const res = new DecoderBuffer(this.base);
    res.offset = save.offset;
    res.length = this.offset;

    this.offset = save.offset;
    Reporter.prototype.restore.call(this, save.reporter);

    return res;
  };

  isEmpty() {
    return this.offset === this.length;
  };

  readUInt8(fail) {
    if (this.offset + 1 <= this.length)
      return this.base.readUInt8(this.offset++, true);
    else
      return this.error(fail || 'DecoderBuffer overrun');
  };

  skip(bytes, fail) {
    if (!(this.offset + bytes <= this.length))
      return this.error(fail || 'DecoderBuffer overrun');

    const res = new DecoderBuffer(this.base);

    // Share reporter state
    res._reporterState = this._reporterState;

    res.offset = this.offset;
    res.length = this.offset + bytes;
    this.offset += bytes;
    return res;
  };

  raw(save) {
    return this.base.slice(save ? save.offset : this.offset, this.length);
  };
};

export class EncoderBuffer {
  constructor(value, reporter) {
    if (Array.isArray(value)) {
      this.length = 0;
      this.value = value.map(function(item) {
        if (!EncoderBuffer.isEncoderBuffer(item))
          item = new EncoderBuffer(item, reporter);
        this.length += item.length;
        return item;
      }, this);
    } else if (typeof value === 'number') {
      if (!(0 <= value && value <= 0xff))
        return reporter.error('non-byte EncoderBuffer value');
      this.value = value;
      this.length = 1;
    } else if (typeof value === 'string') {
      this.value = value;
      this.length = Buffer.byteLength(value);
    } else if (Buffer.isBuffer(value)) {
      this.value = value;
      this.length = value.length;
    } else {
      return reporter.error('Unsupported type: ' + typeof value);
    }
  }

  static isEncoderBuffer(data) {
    if (data instanceof EncoderBuffer) {
      return true;
    }

    // Or accept compatible API
    const isCompatible = typeof data === 'object' &&
      data.constructor.name === 'EncoderBuffer' &&
      typeof data.length === 'number' &&
      typeof data.join === 'function';

    return isCompatible;
  };

  join(out, offset) {
    if (!out)
      out = Buffer.alloc(this.length);
    if (!offset)
      offset = 0;

    if (this.length === 0)
      return out;

    if (Array.isArray(this.value)) {
      this.value.forEach(function(item) {
        item.join(out, offset);
        offset += item.length;
      });
    } else {
      if (typeof this.value === 'number')
        out[offset] = this.value;
      else if (typeof this.value === 'string')
        out.write(this.value, offset);
      else if (Buffer.isBuffer(this.value))
        this.value.copy(out, offset);
      offset += this.length;
    }

    return out;
  };
};

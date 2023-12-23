import { DEREncoder } from "./der.js";

export class PEMEncoder extends DEREncoder {
  constructor(entity) {
    super(entity);
    this.enc = 'pem';
  }

  encode(data, options) {
    const buf = super.encode(data);

    const p = buf.toString('base64');
    const out = [ '-----BEGIN ' + options.label + '-----' ];
    for (let i = 0; i < p.length; i += 64)
      out.push(p.slice(i, i + 64));
    out.push('-----END ' + options.label + '-----');
    return out.join('\n');
  }
};

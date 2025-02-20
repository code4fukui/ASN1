import { inherits } from "https://code4fukui.github.io/inherits/inherits.js";
import { Buffer } from "https://code4fukui.github.io/safer-buffer/safer.js";
import { DERDecoder } from "./der.js";

export class PEMDecoder extends DERDecoder {
  constructor(entity) {
    super(entity);
    this.enc = 'pem';
  }

  decode(data, options) {
    const lines = data.toString().split(/[\r\n]+/g);

    const label = options.label.toUpperCase();

    const re = /^-----(BEGIN|END) ([^-]+)-----$/;
    let start = -1;
    let end = -1;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(re);
      if (match === null)
        continue;

      if (match[2] !== label)
        continue;

      if (start === -1) {
        if (match[1] !== 'BEGIN')
          break;
        start = i;
      } else {
        if (match[1] !== 'END')
          break;
        end = i;
        break;
      }
    }
    if (start === -1 || end === -1)
      throw new Error('PEM section not found for: ' + label);

    const base64 = lines.slice(start + 1, end).join('');
    // Remove excessive symbols
    base64.replace(/[^a-z0-9+/=]+/gi, '');

    const input = Buffer.from(base64, 'base64');
    return super.decode(input, options);
  }
};

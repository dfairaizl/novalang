class Scanner {
  constructor (input) {
    this.input = input;
    this.pos = 0;
    this.rawBuffer = Buffer.from(input, 'utf-8');
  }

  get buffer () {
    return this.rawBuffer;
  }

  eof () {
    return this.input.length === 0 || this.pos > this.rawBuffer.length;
  }

  getChar () {
    const view = this.decodeCharAt(this.pos);

    if (view) {
      this.pos += view.width;
      return view.value;
    }

    this.pos += 1; // bump the cursor by one when we read a null

    return null;
  }

  // adopted from the JSON C implementation
  // http://www.json.org/JSON_checker/utf8_decode.c

  decodeCharAt (pos) {
    let c, c1, c2, c3;
    c = this.readByteAt(pos);

    if (c === null) {
      return null;
    }

    // Zero continuation (0 to 127)
    if ((c & 0x80) === 0) {
      return {
        code: c,
        value: String.fromCodePoint(c),
        width: 1
      };
    }

    // One continuation (128 to 2047)
    if ((c & 0xE0) === 0xC0) {
      c1 = this.readContinuationByte(pos + 1);

      if (c1 >= 0) {
        const codePoint = ((c & 0x1F) << 6) | c1;

        if (codePoint >= 128) {
          return {
            code: codePoint,
            value: String.fromCodePoint(codePoint),
            width: 2
          };
        }
      }
    } else if ((c & 0xF0) === 0xE0) {
      // Two continuations (2048 to 55295 and 57344 to 65535)
      c1 = this.readContinuationByte(pos + 1);
      c2 = this.readContinuationByte(pos + 2);

      if ((c1 | c2) >= 0) {
        const codePoint = ((c & 0x0F) << 12) | (c1 << 6) | c2;

        if (codePoint >= 2048 && (codePoint < 55296 || codePoint > 57343)) {
          return {
            code: codePoint,
            value: String.fromCodePoint(codePoint),
            width: 3
          };
        }
      }
    } else if ((c & 0xF8) === 0xF0) {
      // Three continuations (65536 to 1114111)
      c1 = this.readContinuationByte(pos + 1);
      c2 = this.readContinuationByte(pos + 2);
      c3 = this.readContinuationByte(pos + 3);

      if ((c1 | c2 | c3) >= 0) {
        const codePoint = ((c & 0x07) << 18) | (c1 << 12) | (c2 << 6) | c3;

        if (codePoint >= 65536 && codePoint <= 1114111) {
          return {
            code: codePoint,
            value: String.fromCodePoint(codePoint),
            width: 4
          };
        }
      }
    }

    // invalid character
    return null;
  }

  readContinuationByte (pos) {
    return this.readByteAt(pos) & 0x3F; // get the 6-bit payload
  }

  readByteAt (pos) {
    // dont read a byte our of the bounds of the buffer
    if (this.rawBuffer.length <= 0 || pos >= this.rawBuffer.length) {
      return null;
    }

    return this.rawBuffer.readUInt8(pos) & 0xFF;
  }
}

module.exports = Scanner;

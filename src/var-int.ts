export namespace VarInt {
  /**
   *
   * @param {Buffer} input
   * @returns {VarInt.ReadResult}
   */
  export function read(input: Buffer): [number, Buffer] {
    const first = input[0];

    if (first <= 0xfc) {
      return [first, input.subarray(1)];
    }

    if (first === 0xfd) {
      return [input.readUInt16LE(1), input.subarray(3)];
    }

    if (first === 0xfe) {
      return [input.readUInt32LE(1), input.subarray(5)];
    }

    if (first === 0xff) {
      const a = input.readUInt32LE(1);
      const b = input.readUInt32LE(5);

      return [b * 0xffffffff + a, input.subarray(9)];
    }

    throw new Error(`dunno: ${input.toString('hex')}`);
  }

  /**
   *
   * @param {number} value
   * @returns {Buffer}
   */
  export function write(value: number): Buffer {
    // 0 - 252
    if (value <= 0xfc) {
      return Buffer.from([value]);
    }

    if (value <= 0xffff) {
      const buffer = Buffer.allocUnsafe(2);
      buffer.writeUInt16LE(value);
      return Buffer.from([0xfd, ...buffer]);
    }

    if (value <= 0xffff_ffff) {
      const buffer = Buffer.allocUnsafe(4);
      buffer.writeUInt32LE(value);
      return Buffer.from([0xfe, ...buffer]);
    }

    if (value <= 0xffff_ffff_ffff_ffff) {
      const buffer = Buffer.allocUnsafe(8);
      const a = value % 0xffff_ffff;
      const b = (value - a) / 0xffff_ffff;

      buffer.writeUInt32LE(a, 0);
      buffer.writeUInt32LE(b, 4);

      return Buffer.from([0xff, ...buffer]);
    }

    throw new Error(`dunno: ${value}`);
  }
}

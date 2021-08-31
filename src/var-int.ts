export namespace VarInt {
  /**
   *
   * @param {Buffer} input
   * @returns {VarInt.ReadResult}
   */
  export function read(input: Buffer): [number, Buffer] {
    const first = input[0];

    if (first <= 0xfc) {
      return [first, input.slice(1)];
    }

    if (first === 0xfd) {
      return [input.readUInt16LE(1), input.slice(3)];
    }

    if (first === 0xfe) {
      return [input.readUInt32LE(1), input.slice(5)];
    }

    throw new Error(`dunno: ${input.toString('hex')}`);
  }

  /**
   *
   * @param {number} value
   * @returns {Buffer}
   */
  export function write(value: number): Buffer {
    if (value <= 0xfc) {
      return Buffer.from([value]);
    }

    if (value <= 0xffff) {
      const buffer = Buffer.allocUnsafe(2);
      buffer.writeUInt16LE(value);
      return Buffer.from([0xfd, ...buffer]);
    }

    if (value <= 0xffffffff) {
      const buffer = Buffer.allocUnsafe(4);
      buffer.writeUInt32LE(value);
      return Buffer.from([0xfe, ...buffer]);
    }
    throw new Error(`dunno: ${value}`);
  }
}

import { VarInt } from './var-int';

export namespace VarBuffer {
  export function write(buffer: Buffer): Buffer {
    return Buffer.from([...VarInt.write(buffer.length), ...buffer]);
  }

  export function read(buffer: Buffer): [Buffer, Buffer] {
    const [length, remaining] = VarInt.read(buffer);

    return [remaining.subarray(0, length), remaining.subarray(length)];
  }
}

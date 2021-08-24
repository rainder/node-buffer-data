/* eslint-disable @typescript-eslint/no-empty-interface */
import { VarBuffer } from './var-buffer';
import { VarInt } from './var-int';

export namespace VarObject {
  namespace VarType {
    interface DataTypeArray extends Array<DataTypeValue> {}
    interface DataTypeRecord extends Record<string, DataTypeValue> {}
    type DataTypeValue = null | boolean | string | number | DataTypeArray | DataTypeRecord;
    export type DataType = DataTypeValue;

    export enum Type {
      Null = 0x00,
      Boolean = 0x01,
      String = 0x02,
      Number = 0x03,
      Object = 0x04,
      Array = 0x05,
    }

    export function encode(value: DataType): Buffer | null {
      if (typeof value === 'number') {
        return Buffer.from([Type.Number, ...VarInt.write(value)]);
      }

      if (typeof value === 'string') {
        return Buffer.from([Type.String, ...VarBuffer.write(Buffer.from(value))]);
      }

      if (typeof value === 'boolean') {
        return Buffer.from([Type.Boolean, value ? 0x01 : 0x00]);
      }

      if (Array.isArray(value)) {
        const list = value.map((element): Buffer | null => encode(element)).filter((item): item is Buffer => !!item);

        return Buffer.from([Type.Array, ...VarInt.write(list.length), ...Buffer.concat(list)]);
      }

      if (value === null) {
        return Buffer.from([Type.Null]);
      }

      if (typeof value === 'object') {
        const stack: Buffer[] = [];

        for (const [k, v] of Object.entries(value)) {
          const key = VarBuffer.write(Buffer.from(k));
          const encodedValue = VarType.encode(v);

          if (encodedValue !== null) {
            stack.push(key, encodedValue);
          }
        }

        const data = Buffer.concat(stack);

        return Buffer.from([Type.Object, ...VarInt.write(data.length), ...data]);
      }

      return null;
    }

    export function readType(buffer: Buffer): [Type, Buffer] {
      const type = buffer[0];
      const rest = buffer.slice(1);

      return [type, rest];
    }

    export function decode(input: Buffer): [DataType, Buffer] {
      const [type, r0] = VarType.readType(input);

      if (type === VarType.Type.Object) {
        const result: DataTypeRecord = {};
        const [length, rest] = VarInt.read(r0);
        let chunk = rest.slice(0, length);

        while (chunk?.length) {
          const [key, r1] = VarBuffer.read(chunk);
          const decoded = decode(r1);

          result[key.toString()] = decoded[0];
          chunk = decoded[1];
        }

        return [result, rest.slice(length)];
      }

      if (type === VarType.Type.Number) {
        return VarInt.read(r0);
      }

      if (type === VarType.Type.String) {
        const buffers = VarBuffer.read(r0);

        return [buffers[0].toString(), buffers[1]];
      }

      if (type === VarType.Type.Array) {
        const result: Array<DataType> = [];
        const [length, r1] = VarInt.read(r0);
        let rest = r1;

        for (let i = 0; i < length; i++) {
          const decoded = decode(rest);

          result.push(decoded[0]);
          rest = decoded[1];
        }

        return [result, rest];
      }

      if (type === VarType.Type.Boolean) {
        return [!!r0[0], r0.slice(1)];
      }

      return [null] as never;
    }
  }

  /**
   *
   * @param {T} input
   * @returns {Buffer}
   */
  export function encode<T extends Record<string, unknown>>(input: T): Buffer {
    return VarType.encode(input as never) ?? Buffer.alloc(0);
  }

  /**
   *
   * @param {Buffer} input
   * @returns {T}
   */
  export function decode<T>(input: Buffer): T {
    const decoded = VarType.decode(input);

    return decoded[0] as never;
  }
}

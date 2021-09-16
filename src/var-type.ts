/* eslint-disable @typescript-eslint/no-empty-interface */
import * as crypto from 'crypto';
import { VarBuffer } from './var-buffer';
import { VarInt } from './var-int';

export namespace VarType {
  interface DataTypeArray extends Array<DataTypeValue> {}

  interface DataTypeRecord extends Record<string, DataTypeValue> {}

  type DataTypeValue =
    | Buffer
    | null
    | boolean
    | string
    | number
    | DataTypeArray
    | DataTypeRecord
    | Date
    | Uint8Array
    | undefined
    | bigint
    | Set<any>
    | Map<any, any>
    | RegExp;
  export type DataType = DataTypeValue;

  export type ExtendedType<T = any> = {
    identify: (value: T) => boolean;
    encode: (value: T) => Buffer;
    decode: (value: Buffer) => T;
  };

  export type ExtendedTypes = Record<string, ExtendedType>;

  export enum Type {
    Null = 0x00,
    Boolean = 0x01,
    String = 0x02,
    Number = 0x03,
    Object = 0x04,
    Array = 0x05,
    Buffer = 0x06,
    Double = 0x07,
    Date = 0x08,
    Uint8Array = 0x09,
    CustomType = 0x0a,
    Undefined = 0x0b,
    BigInt = 0x0c,
    Set = 0x0d,
    Map = 0x0e,
    RegExp = 0x0f,
    Infinity = 0x10,
  }

  export function create(extendedTypes: ExtendedTypes) {
    const normalizedExtendedTypes = Object.entries(extendedTypes);

    return {
      encode,
      decode,
    };

    function encode(value: DataType): Buffer {
      if (typeof value === 'number') {
        if (value === Infinity) {
          return Buffer.from([Type.Infinity]);
        }

        if (value % 1 || value < 0) {
          const buffer = Buffer.allocUnsafe(8);

          buffer.writeDoubleBE(value, 0);

          return Buffer.from([Type.Double, ...buffer]);
        } else {
          return Buffer.from([Type.Number, ...VarInt.write(value)]);
        }
      }

      if (typeof value === 'string') {
        return Buffer.from([Type.String, ...VarBuffer.write(Buffer.from(value))]);
      }

      if (typeof value === 'boolean') {
        return Buffer.from([Type.Boolean, value ? 0x01 : 0x00]);
      }

      if (Buffer.isBuffer(value)) {
        return Buffer.from([Type.Buffer, ...VarBuffer.write(value)]);
      }

      if (Array.isArray(value)) {
        const list = value.map((element): Buffer | null => encode(element)).filter((item): item is Buffer => !!item);

        return Buffer.from([Type.Array, ...VarInt.write(list.length), ...Buffer.concat(list)]);
      }

      if (value instanceof Date) {
        const buffer = Buffer.allocUnsafe(8);

        buffer.writeDoubleBE(value.getTime(), 0);

        return Buffer.from([Type.Date, ...buffer]);
      }

      if (value instanceof Uint8Array) {
        return Buffer.from([Type.Uint8Array, ...VarBuffer.write(Buffer.from(value))]);
      }

      if (value === undefined) {
        return Buffer.from([Type.Undefined]);
      }

      if (value === null) {
        return Buffer.from([Type.Null]);
      }

      if (typeof value === 'object' && value.constructor === Object) {
        const stack: Buffer[] = [];

        for (const [k, v] of Object.entries(value)) {
          const key = VarBuffer.write(Buffer.from(k));
          const encodedValue = encode(v);

          if (encodedValue !== null) {
            stack.push(key, encodedValue);
          }
        }

        const data = Buffer.concat(stack);

        return Buffer.from([Type.Object, ...VarInt.write(data.length), ...data]);
      }

      if (typeof value === 'bigint') {
        const hex = value.toString(16);
        const hexNormalized = hex.padStart(Math.round(hex.length / 2) * 2, '0');

        return Buffer.from([Type.BigInt, ...VarBuffer.write(Buffer.from(hexNormalized, 'hex'))]);
      }

      const type = normalizedExtendedTypes.find(([, type]) => type.identify(value));

      if (type) {
        const [identifier, extendedTypeDefinition] = type;

        return Buffer.from([
          Type.CustomType,
          ...VarBuffer.write(Buffer.from(identifier)),
          ...VarBuffer.write(extendedTypeDefinition.encode(value)),
        ]);
      }

      if (value instanceof Set) {
        return Buffer.from([Type.Set, ...encode(Array.from(value.values()))]);
      }

      if (value instanceof Map) {
        return Buffer.from([Type.Map, ...encode(Array.from(value.entries()))]);
      }

      if (value instanceof RegExp) {
        return Buffer.from([Type.RegExp, ...encode([value.source, value.flags])]);
      }

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`cannot encode (${typeof value}) ${value}`);
    }

    function readType(buffer: Buffer): [Type, Buffer] {
      const type = buffer[0];
      const rest = buffer.slice(1);

      return [type, rest];
    }

    function decode(input: Buffer): [DataType, Buffer] {
      const [type, r0] = readType(input);

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

      if (type === VarType.Type.String) {
        const buffers = VarBuffer.read(r0);

        return [buffers[0].toString(), buffers[1]];
      }

      if (type === VarType.Type.Number) {
        return VarInt.read(r0);
      }

      if (type === VarType.Type.Double) {
        return [r0.readDoubleBE(0), r0.slice(8)];
      }

      if (type === VarType.Type.Null) {
        return [null, r0];
      }

      if (type === VarType.Type.Undefined) {
        return [undefined, r0];
      }

      if (type === VarType.Type.Boolean) {
        return [!!r0[0], r0.slice(1)];
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

      if (type === VarType.Type.Date) {
        return [new Date(r0.readDoubleBE(0)), r0.slice(8)];
      }

      if (type === VarType.Type.Buffer) {
        return VarBuffer.read(r0);
      }

      if (type === VarType.Type.Uint8Array) {
        const [a, b] = VarBuffer.read(r0);

        return [Uint8Array.from(a), b];
      }

      if (type === VarType.Type.CustomType) {
        const [identifier, r1] = VarBuffer.read(r0);
        const [value, r2] = VarBuffer.read(r1);
        const extendedType = extendedTypes[identifier.toString()];

        if (!extendedType) {
          throw new Error(`Cannot decode custom type. Decoder for '${identifier.toString()}' is not defined`);
        }

        return [extendedType.decode(value) as never, r2];
      }

      if (type === VarType.Type.BigInt) {
        const [a, b] = VarBuffer.read(r0);

        return [BigInt(`0x${a.toString('hex')}`), b];
      }

      if (type === VarType.Type.Set) {
        const [a, b] = decode(r0);

        return [new Set(a as any[]), b];
      }

      if (type === VarType.Type.Map) {
        const [a, b] = decode(r0);

        return [new Map(a as any[]), b];
      }

      if (type === VarType.Type.RegExp) {
        const [a, b] = decode(r0);

        return [new RegExp(...(a as [string, string])), b];
      }

      if (type === VarType.Type.Infinity) {
        return [Infinity, r0];
      }

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Cannot decode unknown data type: ${type}`);
    }
  }
}

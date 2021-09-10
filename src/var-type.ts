/* eslint-disable @typescript-eslint/no-empty-interface */
import { VarBuffer } from './var-buffer';
import { VarInt } from './var-int';

export namespace VarType {
  interface DataTypeArray extends Array<DataTypeValue> {}

  interface DataTypeRecord extends Record<string, DataTypeValue> {}

  type DataTypeValue = Buffer | null | boolean | string | number | DataTypeArray | DataTypeRecord | Date | Uint8Array;
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
  }

  export function create(extendedTypes: ExtendedTypes) {
    const normalizedExtendedTypes = Object.entries(extendedTypes);

    return {
      encode,
      decode,
    };

    function encode(value: DataType): Buffer | null {
      if (typeof value === 'number') {
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

      if (value === null) {
        return Buffer.from([Type.Null]);
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

      if (typeof value === 'object') {
        if (value.constructor !== Object) {
          if (typeof value.toJSON === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return encode((value as any).toJSON());
          }

          if (typeof value.toString === 'function') {
            return encode(value.toString());
          }
        }

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

      return null;
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

      if (type === VarType.Type.Number) {
        return VarInt.read(r0);
      }

      if (type === VarType.Type.Double) {
        return [r0.readDoubleBE(0), r0.slice(8)];
      }

      if (type === VarType.Type.Date) {
        return [new Date(r0.readDoubleBE(0)), r0.slice(8)];
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
      if (type === VarType.Type.Buffer) {
        return VarBuffer.read(r0);
      }
      if (type === VarType.Type.Uint8Array) {
        const [a, b] = VarBuffer.read(r0);

        return [Uint8Array.from(a), b];
      }
      if (type === VarType.Type.Null) {
        return [null, r0];
      }

      if (type === VarType.Type.CustomType) {
        const [identifier, r1] = VarBuffer.read(r0);
        const [value, r2] = VarBuffer.read(r1);
        const extendedType = extendedTypes[identifier.toString()];

        return [extendedType.decode(value) as never, r2];
      }

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`cannot decode: ${type}`);
    }
  }
}

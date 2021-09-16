/* eslint-disable @typescript-eslint/no-empty-interface */
import { VarType } from './var-type';

export namespace VarObject {
  export interface Coder {
    encode: <T>(input: T) => Buffer;
    decode: <T>(input: Buffer) => T;
    // decodeUnsafe: <T>(input: Buffer) => T;
  }

  const defaultCoder = create({});

  export const encode = defaultCoder.encode;
  export const decode = defaultCoder.decode;

  export function create(extendedTypes: VarType.ExtendedTypes = {}): Coder {
    // const version = crypto.createHash('sha256').update(Object.keys(extendedTypes).join('')).digest().slice(0, 2);
    const varType = VarType.create(extendedTypes);

    return {
      encode(input) {
        // return Buffer.from([...version, ...varType.encode(input as never)]);
        return varType.encode(input as never);
      },
      decode(input) {
        // if (Buffer.compare(version, input.slice(0, 2))) {
        //   throw new Error('version mismatch');
        // }

        const decoded = varType.decode(input.slice(2));

        return decoded[0] as never;
      },
      // decodeUnsafe(input) {
      //   const decoded = varType.decode(input.slice(2));
      //
      //   return decoded[0] as never;
      // },
    };
  }
}

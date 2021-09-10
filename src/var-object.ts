/* eslint-disable @typescript-eslint/no-empty-interface */
import { VarType } from './var-type';

export namespace VarObject {
  export interface Coder {
    encode: <T extends Record<string, unknown>>(input: T) => Buffer;

    decode: <T>(input: Buffer) => T;
  }

  const defaultCoder = create({});

  export const encode = defaultCoder.encode;
  export const decode = defaultCoder.decode;

  export function create(extendedTypes: VarType.ExtendedTypes): Coder {
    const varType = VarType.create(extendedTypes);

    return {
      encode(input) {
        return varType.encode(input as never) ?? Buffer.alloc(0);
      },
      decode(input) {
        const decoded = varType.decode(input);

        return decoded[0] as never;
      },
    };
  }
}

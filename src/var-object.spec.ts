import { expect } from 'chai';
import { VarObject } from './var-object';

describe('var-object', () => {
  it('should compare time', async function () {
    this.timeout(0);

    const measure = (name: string, fn: () => void) => {
      const now = Date.now();
      for (let i = 0; i < 1e3; i++) {
        fn();
      }
      console.log(name, (Date.now() - now) / 1000);
    };

    const json: any = {
      hello: 'world',
      hi: 5,
      array: [{}],
    };

    for (let keys = 0; keys < 10; keys++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      json.array[0][Math.random().toString()] = Math.random();
    }

    for (let items = 0; items < 50; items++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      json.array.push({ ...json.array[0] });
    }

    measure('JSON.stringify', () => {
      JSON.stringify(json);
    });

    measure('VarObject.encode', () => {
      VarObject.encode(json);
    });
  });

  it('should throw an error when customtype is not available for provided value', async () => {
    class MyClass {}

    const input = {
      i: new MyClass(),
    };

    expect(() => {
      VarObject.encode(input);
    }).to.throw('cannot encode');
  });

  it('should encode and decode all supported value types', async () => {
    const input = {
      string: 'one',
      nullValue: null,
      zero: 0,
      // negZero: -0,
      num: 122323.123456123,
      object: {
        double: 123.556,
        negDouble: -123.546,
        int: 1000,
        negInt: -1000,
      },
      array: [{}],
      uInt: new Uint8Array([1, 2, 3]),
      date: new Date(),
      buffer: Buffer.alloc(8),
      undefined: undefined,
      bigint: BigInt('0x1234567890'),
      set: new Set([1, 2, 3, 4]),
      map: new Map([
        [1, 2],
        [3, 4],
      ]),
      regexp: new RegExp('^a-z$', 'ig'),
      infinity: Infinity,
    };

    const enc = VarObject.encode(input);
    const result = VarObject.decode(enc);

    console.log(result);
    expect(result).to.deep.equals(input);
  });

  it('should hydrate custom class', async () => {
    class MyClass {
      constructor(public readonly value: string) {}
    }

    const coder = VarObject.create({
      myType: {
        identify: (value) => value instanceof MyClass,
        encode(value: MyClass) {
          return Buffer.from(value.value);
        },
        decode(value: Buffer) {
          return new MyClass(value.toString());
        },
      },
    });

    const input = {
      asd: new MyClass('some value'),
    };

    const enc = coder.encode(input);
    const decoded = coder.decode<{ asd: MyClass }>(enc);

    expect(decoded).to.deep.equals(input);

    expect(decoded.asd).to.be.instanceof(MyClass);
  });

  // it('should throw an error if trying to decode without extendedTypes defined', async () => {
  //   class MyClass {
  //     toBuffer() {
  //       return Buffer.from([]);
  //     }
  //   }
  //
  //   const coder1 = VarObject.create({
  //     test: {
  //       identify: (value) => value instanceof MyClass,
  //       encode: (value: MyClass) => value.toBuffer(),
  //       decode: () => new MyClass(),
  //     },
  //   });
  //
  //   const coder2 = VarObject.create({});
  //
  //   const encoded = coder1.encode({});
  //
  //   expect(() => {
  //     coder2.decode(encoded);
  //   }).to.throw('version mismatch');
  // });
});

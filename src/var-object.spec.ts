import { expect } from 'chai';
import { VarObject } from './var-object';

describe('json-tokenizer', () => {
  it('should enc dec1', async () => {
    const original = {
      hello: 5,
      someString: 'string',
      object: {
        nullValue: null,
      },
      arrayOfRandomItems: [
        15,
        {
          booleanValue: true,
          booleanValueFalse: false,
        },
      ],
    };

    const encoded = VarObject.encode(original);
    const decoded = VarObject.decode(encoded);

    console.log(encoded);
    console.log(encoded.length);
    console.log(JSON.stringify(original).length);

    console.log(decoded);
    expect(decoded).to.deep.equals(original);
  });
  it('should enc dec2', async () => {
    const original = {
      u: undefined,
      cl: class {},
      fn: () => null,
      a: [() => null],
      someString: 'string',
    };

    const encoded = VarObject.encode(original);
    const decoded = VarObject.decode(encoded);

    expect(decoded).to.deep.equals({
      a: [],
      someString: 'string',
    });
  });
  it('should encode array of buffers', async () => {
    const original = {
      items: [Buffer.from('hello')],
    };

    const encoded = VarObject.encode(original);
    const decoded = VarObject.decode(encoded);

    expect(decoded).to.deep.equals(original);
  });

  it('should compare time', async function () {
    this.timeout(0);

    const measure = (fn: () => void) => {
      const now = Date.now();
      for (let i = 0; i < 1e3; i++) {
        fn();
      }
      console.log((Date.now() - now) / 1000);
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

    measure(() => {
      JSON.stringify(json);
    });

    measure(() => {
      VarObject.encode(json);
    });
  });

  it('should encode doubles', async () => {
    const input = {
      num: 122323.123456123,
    };
    const enc = VarObject.encode(input);
    const dec = VarObject.decode(enc);

    expect(dec).to.deep.equals(input);
  });

  it('should encode instance of a class using toString()', async () => {
    class MyClass {
      toString() {
        return 'MyClass';
      }
    }

    const input = {
      i: new MyClass(),
    };
    const enc = VarObject.encode(input);
    const dec = VarObject.decode(enc);

    expect(dec).to.deep.equals({
      i: 'MyClass',
    });
  });

  it('should encode instance of a class using toJSON()', async () => {
    class MyClass {
      toJSON() {
        return { json: 'MyClass' };
      }
    }

    const input = {
      i: new MyClass(),
    };
    const enc = VarObject.encode(input);
    const dec = VarObject.decode(enc);

    expect(dec).to.deep.equals({
      i: { json: 'MyClass' },
    });
  });

  it('should encode and decode location object', async () => {
    const input = {
      idempotencyKey:
        '898989898989898989898989:kRSQ4zYTTwO2kgMPRYOaoGbKFWgC421EArGvlTADSdUHWPxPaaEuvspmt5sezKPHuZHnSZlBJph9zaLwN23bFNfk8AqQVMMq3fFH',
      vehicleId: 'wZxhgmIwCmC3MxhPdL0fEb',
      consumerId: '898989898989898989898989',
      providerId: '000000000000000000000001',
      displayCurrencyCode: null,
      userId: 'one',
      webhookUrl: null,
      location: {
        location: {
          latitude: 51.5,
          longitude: -0.15,
        },
      },
    };
    const enc = VarObject.encode(input);
    const result = VarObject.decode(enc);

    expect(result).to.deep.equals(input);
  });
});

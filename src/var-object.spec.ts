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
});

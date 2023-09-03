import { expect } from 'chai';
import { VarBuffer } from './var-buffer';

describe('var-buffer', () => {
  it('should write var buffer 50', async () => {
    const result = VarBuffer.write(Buffer.from('penki'.repeat(10)));

    expect(result[0]).to.equals(50);
  });
  it('should write var buffer 500', async () => {
    const result = VarBuffer.write(Buffer.from('penki'.repeat(100)));

    expect(result.subarray(0, 3)).to.deep.equals(Buffer.from([0xfd, 0xf4, 0x01]));
  });
  it('should read var buffer', async () => {
    const result = VarBuffer.read(Buffer.from([0x5, ...Buffer.from([1, 2, 3, 4, 5, 0, 0, 0, 0])]));

    expect(result).to.deep.equals([Buffer.from([1, 2, 3, 4, 5]), Buffer.from([0, 0, 0, 0])]);
  });
});

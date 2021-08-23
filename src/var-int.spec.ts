import { expect } from 'chai';
import { VarInt } from './var-int';

describe('var-int', () => {
  it('should read 0x61', async () => {
    expect(VarInt.read(Buffer.from('6a00', 'hex'))).to.deep.equals({
      value: 106,
      remaining: Buffer.from('00', 'hex'),
    });
  });
  it('should read 0xfd2602', async () => {
    expect(VarInt.read(Buffer.from('fd260200', 'hex'))).to.deep.equals({
      value: 550,
      remaining: Buffer.from('00', 'hex'),
    });
  });
  it('should read 0xfe703a0f00', async () => {
    expect(VarInt.read(Buffer.from('fe703a0f00ff', 'hex'))).to.deep.equals({
      value: 998000,
      remaining: Buffer.from('ff', 'hex'),
    });
  });

  it('should write 0x61', async () => {
    expect(VarInt.write(106)).to.deep.equals(Buffer.from('6a', 'hex'));
  });

  it('should write 0xfd2602', async () => {
    expect(VarInt.write(550)).to.deep.equals(Buffer.from('fd2602', 'hex'));
  });

  it('should write 0xfe703a0f00', async () => {
    expect(VarInt.write(998000)).to.deep.equals(Buffer.from('fe703a0f00', 'hex'));
  });
});

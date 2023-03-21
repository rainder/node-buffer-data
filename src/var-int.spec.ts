import { expect } from 'chai';
import { VarInt } from './var-int';

describe('var-int', () => {
  it('should read 0x61', async () => {
    expect(VarInt.read(Buffer.from('6a00', 'hex'))).to.deep.equals([106, Buffer.from('00', 'hex')]);
  });
  it('should read 0xfd2602', async () => {
    expect(VarInt.read(Buffer.from('fd260200', 'hex'))).to.deep.equals([550, Buffer.from('00', 'hex')]);
  });
  it('should read 0xfe703a0f00', async () => {
    expect(VarInt.read(Buffer.from('fe703a0f00ff', 'hex'))).to.deep.equals([998000, Buffer.from('ff', 'hex')]);
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

  it('should write 1679409430789', async () => {
    expect(VarInt.write(1679409430789)).to.deep.equals(Buffer.from('ff8c429a0487010000', 'hex'));
  });

  it('should read 1679409430789', async () => {
    expect(VarInt.read(VarInt.write(1679409430789))).to.deep.equals([1679409430789, Buffer.alloc(0)]);
  });

  it('should read MAX_SAFE_INTEGER', async () => {
    expect(VarInt.read(VarInt.write(Number.MAX_SAFE_INTEGER))).to.deep.equals([
      Number.MAX_SAFE_INTEGER,
      Buffer.alloc(0),
    ]);
  });
});

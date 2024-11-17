import {NDBFormatOffsetPipe} from './ndb-format-offset.pipe';

describe('NDBFormatOffsetPipe', () => {
  it('should create instance', () => {
    const pipe = new NDBFormatOffsetPipe();

    expect(pipe).toBeTruthy();
  });

  it('should format 142 as 0x8E', () => {
    const pipe = new NDBFormatOffsetPipe();

    expect(pipe.transform(142)).toEqual('0x8E');
  });
});

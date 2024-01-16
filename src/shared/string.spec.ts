import {cyrb53} from "./string";

describe('cyrb53(string, seed = 0)', () => {

  it('should return hash code 5211024121371232 with \'Hello world!\'', () => {
    expect(cyrb53('Hello world!')).toBe(5211024121371232);
  });

  it('should return hash code 23061388323667 with \'ScriptGameInstance\'', () => {
    expect(cyrb53('ScriptGameInstance')).toBe(23061388323667);
  });

});

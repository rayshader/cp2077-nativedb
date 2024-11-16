import {WikiClient, WikiEncodingError} from "./wiki.client";
import {HttpClient} from "@angular/common/http";
import {EMPTY, firstValueFrom, of} from "rxjs";
import {WikiFileDto, WikiFileEntryDto} from "../dtos/wiki.dto";
import {GitHubFileDto, GitHubFileEntryDto} from "../dtos/github.dto";

describe('WikiClient', () => {
  let mockHttpClient: Partial<HttpClient>;
  let wiki: WikiClient;

  beforeAll(() => {
    mockHttpClient = {
      get: jest.fn().mockReturnValue(EMPTY),
    };
    wiki = new WikiClient(mockHttpClient as HttpClient);
  });

  describe('getClass(\'ScriptGameInstance\')', () => {
    let mockGetFileFrom: jest.SpyInstance;

    beforeAll(() => {
      mockGetFileFrom = jest.spyOn(wiki, 'getFileFrom' as any);
    });

    it('should throw WikiEncodingError when encoding is not \'base64\'', async () => {
      // GIVEN
      mockGetFileFrom.mockReturnValueOnce(of({encoding: 'binary'}));

      // WHEN
      const promise: Promise<WikiFileDto> = firstValueFrom(wiki.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).rejects.toThrow(WikiEncodingError);
    });

    it('should emit WikiFileDto with decoded data and strip markdown of options', async () => {
      // GIVEN
      mockGetFileFrom.mockReturnValueOnce(of(<GitHubFileDto>{
        encoding: 'base64',
        content: 'LS0tCmxheW91dDoKICB0aXRsZToKICAgIHZpc2libGU6IHRydWUKICBkZXNjcmlwdGlvbjoKICAgIHZpc2libGU6IGZhbHNlCiA' +
          'gdGFibGVPZkNvbnRlbnRzOgogICAgdmlzaWJsZTogdHJ1ZQogIG91dGxpbmU6CiAgICB2aXNpYmxlOiB0cnVlCiAgcGFnaW5hdGlvbjoKI' +
          'CAgIHZpc2libGU6IHRydWUKLS0tCgojIFNjcmlwdEdhbWVJbnN0YW5jZQoKIyMgRGVzY3JpcHRpb24KClRlc3RpbmcgV2lraUNsaWVudCB' +
          '3aXRoIHN0cnVjdCBTY3JpcHRHYW1lSW5zdGFuY2Uu',
        sha: '<SHA>',
        name: 'scriptgameinstance.md',
        path: '<PATH>',
      }));

      // WHEN
      const promise: Promise<WikiFileDto> = firstValueFrom(wiki.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(<WikiFileDto>{
        sha: '<SHA>',
        fileName: 'scriptgameinstance.md',
        className: 'scriptgameinstance',
        path: '<PATH>',
        markdown: `# ScriptGameInstance

## Description

Testing WikiClient with struct ScriptGameInstance.`,
      });
    });
  });

  describe('getClasses()', () => {
    let mockGetFilesFrom: jest.SpyInstance;

    beforeAll(() => {
      mockGetFilesFrom = jest.spyOn(wiki, 'getFilesFrom' as any);
    });

    it('should emit a list of classes', async () => {
      // GIVEN
      mockGetFilesFrom.mockReturnValueOnce(of(<GitHubFileEntryDto[]>[
        {sha: '', 'path': '', name: 'scriptgameinstance.md', type: 'file'},
        {sha: '', 'path': '', name: 'gameblackboardsystem.md', type: 'file'},
        {sha: '', 'path': '', name: 'vehiclebaseobject.md', type: 'file'},
      ]));

      // WHEN
      const promise: Promise<WikiFileEntryDto[]> = firstValueFrom(wiki.getClasses());

      // THEN
      await expect(promise).resolves.toEqual(expect.arrayContaining([
        {sha: '', 'path': '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'},
        {sha: '', 'path': '', fileName: 'gameblackboardsystem.md', className: 'gameblackboardsystem'},
        {sha: '', 'path': '', fileName: 'vehiclebaseobject.md', className: 'vehiclebaseobject'},
      ]));
    });
  });

  describe('getGlobals()', () => {
    let mockGetFileFrom: jest.SpyInstance;

    beforeAll(() => {
      mockGetFileFrom = jest.spyOn(wiki, 'getFileFrom' as any);
    });

    it('should throw WikiEncodingError when encoding is not \'base64\'', async () => {
      // GIVEN
      mockGetFileFrom.mockReturnValueOnce(of({encoding: 'binary'}));

      // WHEN
      const promise: Promise<WikiFileDto> = firstValueFrom(wiki.getGlobals());

      // THEN
      await expect(promise).rejects.toThrow(WikiEncodingError);
    });

    it('should emit WikiFileDto with decoded data and strip markdown of options', async () => {
      // GIVEN
      mockGetFileFrom.mockReturnValueOnce(of(<GitHubFileDto>{
        encoding: 'base64',
        content: 'LS0tCmxheW91dDoKICB0aXRsZToKICAgIHZpc2libGU6IHRydWUKICBkZXNj\n' +
          'cmlwdGlvbjoKICAgIHZpc2libGU6IGZhbHNlCiAgdGFibGVPZkNvbnRlbnRz\n' +
          'OgogICAgdmlzaWJsZTogdHJ1ZQogIG91dGxpbmU6CiAgICB2aXNpYmxlOiB0\n' +
          'cnVlCiAgcGFnaW5hdGlvbjoKICAgIHZpc2libGU6IHRydWUKLS0tCgojIEdM\n' +
          'T0JBTFMKCiMjIyMgR2V0R2FtZUluc3RhbmNlKCkgLT4gU2NyaXB0R2FtZUlu\n' +
          'c3RhbmNlCgpXaGVuIFtDb2Rld2FyZV0oaHR0cHM6Ly9naXRodWIuY29tL3Bz\n' +
          'aWJlcngvY3AyMDc3LWNvZGV3YXJlL3dpa2kpIGlzIGluc3RhbGxlZCwgeW91\n' +
          'IGNhbiB1c2UgdGhpcyBmdW5jdGlvbiB3aXRob3V0IGlzc3Vlcy4gT3RoZXJ3\n' +
          'aXNlLCB5b3UgbWF5IG5lZWQgdG8gZ2V0IFxbR2FtZUluc3RhbmNlXSB0aHJv\n' +
          'dWdoIG90aGVyIGZ1bmN0aW9ucyBsaWtlIFxbR2FtZU9iamVjdC5HZXRHYW1l\n' +
          'XSBmb3IgZXhhbXBsZS4KClRoaXMgZnVuY3Rpb24gd2lsbCBvbmx5IHdvcmsg\n' +
          'd2hlbiB0aGUgZ2FtZSBlbmdpbmUgaXMgaW5pdGlhbGl6ZWQsIG1lYW5pbmcg\n' +
          'YSBcW0dhbWVJbnN0YW5jZV0gZG8gZXhpc3RzLgo=\n',
        sha: '<SHA>',
        name: 'globals.md',
        path: '<PATH>',
      }));

      // WHEN
      const promise: Promise<WikiFileDto> = firstValueFrom(wiki.getGlobals());

      // THEN
      await expect(promise).resolves.toEqual(<WikiFileDto>{
        sha: '<SHA>',
        fileName: 'globals.md',
        className: 'GLOBALS',
        path: '<PATH>',
        markdown: `# GLOBALS

#### GetGameInstance() -> ScriptGameInstance

When [Codeware](https://github.com/psiberx/cp2077-codeware/wiki) is installed, you can use this function without issues. Otherwise, you may need to get \\[GameInstance] through other functions like \\[GameObject.GetGame] for example.

This function will only work when the game engine is initialized, meaning a \\[GameInstance] do exists.
`,
      });
    });
  });

});

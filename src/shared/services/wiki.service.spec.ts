import {WikiService} from "./wiki.service";
import {WikiClassesRepository} from "../repositories/wiki-classes.repository";
import {WikiClient} from "../clients/wiki.client";
import {WikiParser, WikiParserError, WikiParserErrorCode} from "../parsers/wiki.parser";
import {MatSnackBar} from "@angular/material/snack-bar";
import {firstValueFrom, of, throwError} from "rxjs";
import {WikiClassDto, WikiFileDto, WikiFileEntryDto, WikiGlobalDto} from "../dtos/wiki.dto";
import {cyrb53} from "../string";
import {GitHubRateLimit, GitHubRateLimitError} from "../clients/github.client";
import {HttpHeaders, HttpResponse} from "@angular/common/http";
import {WikiGlobalsRepository} from "../repositories/wiki-globals.repository";
import SpyInstance = jest.SpyInstance;

/**
 * Mock all properties in T
 */
type PartialMock<T> = {
  [P in keyof T]?: any;
};

describe('WikiService', () => {
  let mockClassesRepository: PartialMock<WikiClassesRepository>;
  let mockGlobalsRepository: PartialMock<WikiGlobalsRepository>;
  let mockClient: PartialMock<WikiClient>;
  let mockToast: PartialMock<MatSnackBar>;

  let parser: WikiParser;

  let service: WikiService;

  beforeAll(() => {
    mockClassesRepository = {
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    mockGlobalsRepository = {
      findAll: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    mockClient = {
      getClasses: jest.fn(),
      getGlobals: jest.fn(),
      getClass: jest.fn(),
    };
    mockToast = {
      open: jest.fn(),
    };

    parser = new WikiParser();

    // NOTE: create WikiService just-in-time using setup(). Mock must be
    //       implemented before calling constructor.
  });

  afterEach(() => {
    mockClassesRepository.findByName.mockReset();
    mockClassesRepository.create.mockReset();
    mockClassesRepository.update.mockReset();
    mockClassesRepository.delete.mockReset();

    mockGlobalsRepository.findAll.mockReset();
    mockGlobalsRepository.findByName.mockReset();
    mockGlobalsRepository.create.mockReset();
    mockGlobalsRepository.update.mockReset();
    mockGlobalsRepository.delete.mockReset();

    mockClient.getClasses.mockReset();
    mockClient.getClass.mockReset();

    mockToast.open.mockReset();
  });

  const setup = () => {
    jest.setSystemTime(new Date('2024-11-16 14:00:00'));
    service = new WikiService(
      mockClassesRepository as unknown as WikiClassesRepository,
      mockGlobalsRepository as unknown as WikiGlobalsRepository,
      mockClient as unknown as WikiClient,
      parser,
      mockToast as unknown as MatSnackBar
    );
    jest.setSystemTime(new Date('2024-11-16 15:00:00'));
  };

  const createRateLimit = (limit: number = 60, remaining: number = 50, reset: Date = new Date()) => {
    const headers: HttpHeaders = new HttpHeaders();

    headers.set('x-ratelimit-limit', limit.toString());
    headers.set('x-ratelimit-remaining', remaining.toString());
    headers.set('x-ratelimit-used', (limit - remaining).toString());
    headers.set('x-ratelimit-reset', reset.getTime().toString());
    headers.set('x-ratelimit-resource', 'core');
    return new GitHubRateLimit(headers);
  };

  describe('getClass(\'ScriptGameInstance\')', () => {
    let spyParseClass: SpyInstance;

    beforeAll(() => {
      spyParseClass = jest.spyOn(parser, 'parseClass');
    });

    beforeEach(() => {
      mockClient.getGlobals.mockReturnValueOnce(of());
    });

    afterEach(() => {
      spyParseClass.mockClear();
    });

    it('should show a toast when GitHubRateLimitError is thrown', async () => {
      // GIVEN
      const error: Error = new GitHubRateLimitError(createRateLimit());

      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(throwError(() => error));
      mockClassesRepository.findByName.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith(
        'Failed to get documentation from GitBook. Reason: api rate limit reached.'
      );
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockClassesRepository.create).not.toHaveBeenCalled();
      expect(mockClassesRepository.update).not.toHaveBeenCalled();
      expect(mockClassesRepository.delete).not.toHaveBeenCalled();
    });

    it('should show a toast when WikiParserError is thrown without title', async () => {
      // GIVEN
      const error: Error = new WikiParserError('ScriptGameInstance', WikiParserErrorCode.noTitle);

      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(throwError(() => error));
      mockClassesRepository.findByName.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith(
        'Failed to parse documentation. Reason: no title found for \`ScriptGameInstance\`.'
      );
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockClassesRepository.create).not.toHaveBeenCalled();
      expect(mockClassesRepository.update).not.toHaveBeenCalled();
      expect(mockClassesRepository.delete).not.toHaveBeenCalled();
    });

    it('should show a toast when WikiParserError is thrown without content', async () => {
      // GIVEN
      const error: Error = new WikiParserError('ScriptGameInstance', WikiParserErrorCode.noContent);

      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(throwError(() => error));
      mockClassesRepository.findByName.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith(
        'Failed to parse documentation. Reason: no description nor functions found for \`ScriptGameInstance\`.'
      );
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockClassesRepository.create).not.toHaveBeenCalled();
      expect(mockClassesRepository.update).not.toHaveBeenCalled();
      expect(mockClassesRepository.delete).not.toHaveBeenCalled();
    });

    it('should show a toast when an unknown Error is thrown', async () => {
      // GIVEN
      const error: Error = new Error();

      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(throwError(() => error));
      mockClassesRepository.findByName.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith('Failed to get documentation from GitBook. Reason: unknown.');
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockClassesRepository.create).not.toHaveBeenCalled();
      expect(mockClassesRepository.update).not.toHaveBeenCalled();
      expect(mockClassesRepository.delete).not.toHaveBeenCalled();
    });


    it('should emit undefined when page is not found in cache and request is empty', async () => {
      // GIVEN
      mockClient.getClasses.mockReturnValueOnce(of([]));
      mockClassesRepository.findByName.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
    });

    it('should emit and create class in cache when page is requested for the first time', async () => {
      // GIVEN
      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(of(<WikiFileDto>{
        sha: '',
        fileName: 'scriptgameinstance.md',
        className: 'scriptgameinstance',
        markdown: `# ScriptGameInstance

## Description

Parsing Markdown is already tested in WikiParser...`,
        path: ''
      }));
      mockClassesRepository.findByName.mockReturnValueOnce(of(undefined));
      mockClassesRepository.create.mockReturnValueOnce(of(42));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(expect.objectContaining<WikiClassDto>({
        id: cyrb53('ScriptGameInstance'),
        name: 'ScriptGameInstance',
        sha: '',
        comment: 'Parsing Markdown is already tested in WikiParser...',
        functions: []
      }));
      expect(spyParseClass).toHaveBeenCalled();
      expect(mockClassesRepository.create).toHaveBeenCalled();
      expect(mockClassesRepository.update).not.toHaveBeenCalled();
      expect(mockClassesRepository.delete).not.toHaveBeenCalled();
    });

    it('should emit and update class in cache when page is found but request is newer', async () => {
      // GIVEN
      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '2', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(of(<WikiFileDto>{
        sha: '2',
        fileName: 'scriptgameinstance.md',
        className: 'scriptgameinstance',
        markdown: `# ScriptGameInstance

## Description

Data is different between GitHub and cache...`,
        path: ''
      }));
      mockClassesRepository.findByName.mockReturnValueOnce(of({
        id: cyrb53('ScriptGameInstance'),
        name: 'ScriptGameInstance',
        sha: '1',
        comment: 'Parsing Markdown is already tested in WikiParser...',
        functions: []
      }));
      mockClassesRepository.update.mockReturnValueOnce(of(42));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(expect.objectContaining<WikiClassDto>({
        id: cyrb53('ScriptGameInstance'),
        name: 'ScriptGameInstance',
        sha: '2',
        comment: 'Data is different between GitHub and cache...',
        functions: []
      }));
      expect(spyParseClass).toHaveBeenCalled();
      expect(mockClassesRepository.update).toHaveBeenCalled();
      expect(mockClassesRepository.create).not.toHaveBeenCalled();
      expect(mockClassesRepository.delete).not.toHaveBeenCalled();
    });

    it('should emit class from cache when page is found and is not changed', async () => {
      // GIVEN
      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '3', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(of(<WikiFileDto>{
        sha: '3',
        fileName: 'scriptgameinstance.md',
        className: 'scriptgameinstance',
        markdown: `# ScriptGameInstance

## Description

Data was not changed between GitHub and cache...`,
        path: ''
      }));
      mockClassesRepository.findByName.mockReturnValueOnce(of({
        id: cyrb53('ScriptGameInstance'),
        name: 'ScriptGameInstance',
        sha: '3',
        comment: 'Data was not changed between GitHub and cache...',
        functions: []
      }));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(expect.objectContaining<WikiClassDto>({
        id: cyrb53('ScriptGameInstance'),
        name: 'ScriptGameInstance',
        sha: '3',
        comment: 'Data was not changed between GitHub and cache...',
        functions: []
      }));
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockClassesRepository.create).not.toHaveBeenCalled();
      expect(mockClassesRepository.update).not.toHaveBeenCalled();
      expect(mockClassesRepository.delete).not.toHaveBeenCalled();
    });

    it('should emit undefined and remove class from cache when page is cached but request is empty', async () => {
      // GIVEN
      mockClient.getClasses.mockReturnValueOnce(of([]));
      mockClient.getClass.mockReturnValueOnce(of(undefined));
      mockClassesRepository.findByName.mockReturnValueOnce(of({
        id: cyrb53('ScriptGameInstance'),
        name: 'ScriptGameInstance',
        sha: '3',
        comment: 'Data is present in cache but was removed from GitHub...',
        functions: []
      }));
      mockClassesRepository.delete.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockClassesRepository.delete).toHaveBeenCalled();
      expect(mockClassesRepository.create).not.toHaveBeenCalled();
      expect(mockClassesRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getGlobal(\'GetGameInstance\')', () => {
    const id: number = cyrb53('GetGameInstanceScriptGameInstance');

    let spyParseGlobals: SpyInstance;

    beforeAll(() => {
      spyParseGlobals = jest.spyOn(parser, 'parseGlobals');
    });

    beforeEach(() => {
      mockClient.getClass.mockReturnValueOnce(of());
      mockClient.getClasses.mockReturnValueOnce(of());
    });

    afterEach(() => {
      spyParseGlobals.mockClear();
    });

    it('should show a toast when GitHubRateLimitError is thrown', async () => {
      // GIVEN
      const error: Error = new GitHubRateLimitError(createRateLimit());

      mockClient.getGlobals.mockReturnValueOnce(throwError(() => error));
      setup();

      // WHEN
      const promise: Promise<WikiGlobalDto | undefined> = firstValueFrom(service.getGlobal(id));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith(
        'Failed to get documentation from GitBook. Reason: api rate limit reached.'
      );
      expect(spyParseGlobals).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.create).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.update).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.delete).not.toHaveBeenCalled();
    });

    it('should show a toast when WikiParserError is thrown without title', async () => {
      // GIVEN
      const error: Error = new WikiParserError('GLOBALS', WikiParserErrorCode.noTitle);

      mockClient.getGlobals.mockReturnValueOnce(throwError(() => error));
      setup();

      // WHEN
      const promise: Promise<WikiGlobalDto | undefined> = firstValueFrom(service.getGlobal(id));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith(
        'Failed to parse documentation. Reason: no title found for \`GLOBALS\`.'
      );
      expect(spyParseGlobals).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.create).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.update).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.delete).not.toHaveBeenCalled();
    });

    it('should show a toast when an unknown Error is thrown', async () => {
      // GIVEN
      const error: Error = new Error();

      mockClient.getGlobals.mockReturnValueOnce(throwError(() => error));
      setup();

      // WHEN
      const promise: Promise<WikiGlobalDto | undefined> = firstValueFrom(service.getGlobal(id));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith('Failed to get documentation from GitBook. Reason: unknown.');
      expect(spyParseGlobals).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.create).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.update).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.delete).not.toHaveBeenCalled();
    });


    it('should emit undefined when global is not found in cache and request is empty', async () => {
      // GIVEN
      const error = new HttpResponse<any>();

      mockClient.getGlobals.mockReturnValueOnce(throwError(() => error));
      mockGlobalsRepository.findAll.mockReturnValueOnce(of([]));
      setup();

      // WHEN
      const promise: Promise<WikiGlobalDto | undefined> = firstValueFrom(service.getGlobal(id));

      // THEN
      await expect(promise).resolves.toEqual(undefined);

    });

    it('should emit and create global in cache when page is requested for the first time', async () => {
      // GIVEN
      mockClient.getGlobals.mockReturnValueOnce(of(<WikiFileDto>{
        sha: '<SHA>',
        fileName: 'globals.md',
        className: 'GLOBALS',
        path: '<PATH>',
        markdown: `# GLOBALS

#### GetGameInstance() -> ScriptGameInstance

Parsing Markdown is already tested in WikiParser...`
      }));
      mockGlobalsRepository.findAll.mockReturnValueOnce(of([]));
      mockGlobalsRepository.create.mockReturnValueOnce(of(42));
      setup();

      // WHEN
      const promise: Promise<WikiGlobalDto | undefined> = firstValueFrom(service.getGlobal(id));

      // THEN
      await expect(promise).resolves.toEqual(expect.objectContaining<WikiGlobalDto>({
        id: cyrb53('GetGameInstanceScriptGameInstance'),
        name: 'GetGameInstance',
        sha: '<SHA>',
        comment: 'Parsing Markdown is already tested in WikiParser...',
      }));
      expect(spyParseGlobals).toHaveBeenCalled();
      expect(mockGlobalsRepository.create).toHaveBeenCalled();
      expect(mockGlobalsRepository.update).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.delete).not.toHaveBeenCalled();
    });

    it('should emit and update global in cache when page is found but request is newer', async () => {
      // GIVEN
      mockClient.getGlobals.mockReturnValueOnce(of(<WikiFileDto>{
        sha: '<SHA-UPDATE>',
        fileName: 'globals.md',
        className: 'GLOBALS',
        path: '<PATH>',
        markdown: `# GLOBALS

#### GetGameInstance() -> ScriptGameInstance

Documentation has changed :)`
      }));
      mockGlobalsRepository.findAll.mockReturnValueOnce(of(<WikiGlobalDto[]>[
        {
          id: cyrb53('GetGameInstanceScriptGameInstance'),
          name: 'GetGameInstance',
          comment: 'Parsing Markdown is already tested in WikiParser...',
          sha: '<SHA>'
        }
      ]));
      mockGlobalsRepository.update.mockReturnValueOnce(of(42));
      setup();

      // WHEN
      const promise: Promise<WikiGlobalDto | undefined> = firstValueFrom(service.getGlobal(id));

      // THEN
      await expect(promise).resolves.toEqual(expect.objectContaining<WikiGlobalDto>({
        id: cyrb53('GetGameInstanceScriptGameInstance'),
        name: 'GetGameInstance',
        sha: '<SHA-UPDATE>',
        comment: 'Documentation has changed :)',
      }));
      expect(spyParseGlobals).toHaveBeenCalled();
      expect(mockGlobalsRepository.update).toHaveBeenCalled();
      expect(mockGlobalsRepository.create).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.delete).not.toHaveBeenCalled();
    });

    it('should emit global from cache when page is found and is not changed', async () => {
      // GIVEN
      mockClient.getGlobals.mockReturnValueOnce(of(<WikiFileDto>{
        sha: '<SHA-CACHE>',
        fileName: 'globals.md',
        className: 'GLOBALS',
        path: '<PATH>',
        markdown: `# GLOBALS

#### GetGameInstance() -> ScriptGameInstance

Parsing Markdown is already tested in WikiParser...`
      }));
      mockGlobalsRepository.findAll.mockReturnValueOnce(of(<WikiGlobalDto[]>[
        {
          id: cyrb53('GetGameInstanceScriptGameInstance'),
          name: 'GetGameInstance',
          comment: 'Parsing Markdown is already tested in WikiParser...',
          sha: '<SHA-CACHE>'
        }
      ]));
      setup();

      // WHEN
      const promise: Promise<WikiGlobalDto | undefined> = firstValueFrom(service.getGlobal(id));

      // THEN
      await expect(promise).resolves.toEqual(expect.objectContaining<WikiGlobalDto>({
        id: cyrb53('GetGameInstanceScriptGameInstance'),
        name: 'GetGameInstance',
        sha: '<SHA-CACHE>',
        comment: 'Parsing Markdown is already tested in WikiParser...',
      }));
      expect(spyParseGlobals).toHaveBeenCalled();
      expect(mockGlobalsRepository.create).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.update).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.delete).not.toHaveBeenCalled();
    });

    it('should emit undefined and remove global from cache when page is cached but request is empty', async () => {
      // GIVEN
      mockClient.getGlobals.mockReturnValueOnce(of(<WikiFileDto>{
        sha: '<SHA-DELETE>',
        fileName: 'globals.md',
        className: 'GLOBALS',
        path: '<PATH>',
        markdown: `# GLOBALS`
      }));
      mockGlobalsRepository.findAll.mockReturnValueOnce(of(<WikiGlobalDto[]>[
        {
          id: cyrb53('GetGameInstanceScriptGameInstance'),
          name: 'GetGameInstance',
          comment: 'Parsing Markdown is already tested in WikiParser...',
          sha: '<SHA>'
        }
      ]));
      setup();

      // WHEN
      const promise: Promise<WikiGlobalDto | undefined> = firstValueFrom(service.getGlobal(id));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(spyParseGlobals).toHaveBeenCalled();
      expect(mockGlobalsRepository.delete).toHaveBeenCalled();
      expect(mockGlobalsRepository.create).not.toHaveBeenCalled();
      expect(mockGlobalsRepository.update).not.toHaveBeenCalled();
    });
  });
});

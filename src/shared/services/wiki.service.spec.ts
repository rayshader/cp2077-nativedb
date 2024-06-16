import {WikiService} from "./wiki.service";
import {WikiRepository} from "../repositories/wiki.repository";
import {WikiClient} from "../clients/wiki.client";
import {WikiParser, WikiParserError, WikiParserErrorCode} from "../parsers/wiki.parser";
import {MatSnackBar} from "@angular/material/snack-bar";
import {firstValueFrom, of, throwError} from "rxjs";
import {WikiClassDto, WikiFileDto, WikiFileEntryDto} from "../dtos/wiki.dto";
import {cyrb53} from "../string";
import {GitHubRateLimit, GitHubRateLimitError} from "../clients/github.client";
import {HttpHeaders} from "@angular/common/http";
import SpyInstance = jest.SpyInstance;

/**
 * Mock all properties in T
 */
type PartialMock<T> = {
  [P in keyof T]?: any;
};

describe('WikiService', () => {
  let mockRepository: PartialMock<WikiRepository>;
  let mockClient: PartialMock<WikiClient>;
  let mockToast: PartialMock<MatSnackBar>;

  let parser: WikiParser;

  let service: WikiService;

  beforeAll(() => {
    mockRepository = {
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    mockClient = {
      getClasses: jest.fn(),
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
    mockRepository.findByName.mockReset();
    mockRepository.create.mockReset();
    mockRepository.update.mockReset();
    mockRepository.delete.mockReset();

    mockClient.getClasses.mockReset();
    mockClient.getClass.mockReset();

    mockToast.open.mockReset();
  });

  const setup = () => {
    service = new WikiService(
      mockRepository as unknown as WikiRepository,
      mockClient as unknown as WikiClient,
      parser,
      mockToast as unknown as MatSnackBar
    );
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
      mockRepository.findByName.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith(
        'Failed to get documentation from GitBook. Reason: api rate limit reached.'
      );
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should show a toast when WikiParserError is thrown without title', async () => {
      // GIVEN
      const error: Error = new WikiParserError('ScriptGameInstance', WikiParserErrorCode.noTitle);

      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(throwError(() => error));
      mockRepository.findByName.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith(
        'Failed to parse documentation. Reason: no title found for \`ScriptGameInstance\`.'
      );
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should show a toast when WikiParserError is thrown without content', async () => {
      // GIVEN
      const error: Error = new WikiParserError('ScriptGameInstance', WikiParserErrorCode.noContent);

      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(throwError(() => error));
      mockRepository.findByName.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith(
        'Failed to parse documentation. Reason: no description nor functions found for \`ScriptGameInstance\`.'
      );
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should show a toast when an unknown Error is thrown', async () => {
      // GIVEN
      const error: Error = new Error();

      mockClient.getClasses.mockReturnValueOnce(of(<WikiFileEntryDto[]>[
        {sha: '', path: '', fileName: 'scriptgameinstance.md', className: 'scriptgameinstance'}
      ]));
      mockClient.getClass.mockReturnValueOnce(throwError(() => error));
      mockRepository.findByName.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(mockToast.open).toHaveBeenCalledWith('Failed to get documentation from GitBook. Reason: unknown.');
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });


    it('should emit undefined when page is not found in cache and request is empty', async () => {
      // GIVEN
      mockClient.getClasses.mockReturnValueOnce(of([]));
      mockRepository.findByName.mockReturnValueOnce(of(undefined));
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
      mockRepository.findByName.mockReturnValueOnce(of(undefined));
      mockRepository.create.mockReturnValueOnce(of(42));
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
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
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
      mockRepository.findByName.mockReturnValueOnce(of({
        id: cyrb53('ScriptGameInstance'),
        name: 'ScriptGameInstance',
        sha: '1',
        comment: 'Parsing Markdown is already tested in WikiParser...',
        functions: []
      }));
      mockRepository.update.mockReturnValueOnce(of(42));
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
      expect(mockRepository.update).toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
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
      mockRepository.findByName.mockReturnValueOnce(of({
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
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should emit undefined and remove class from cache when page is cached but request is empty', async () => {
      // GIVEN
      mockClient.getClasses.mockReturnValueOnce(of([]));
      mockClient.getClass.mockReturnValueOnce(of(undefined));
      mockRepository.findByName.mockReturnValueOnce(of({
        id: cyrb53('ScriptGameInstance'),
        name: 'ScriptGameInstance',
        sha: '3',
        comment: 'Data is present in cache but was removed from GitHub...',
        functions: []
      }));
      mockRepository.delete.mockReturnValueOnce(of(undefined));
      setup();

      // WHEN
      const promise: Promise<WikiClassDto | undefined> = firstValueFrom(service.getClass('ScriptGameInstance'));

      // THEN
      await expect(promise).resolves.toEqual(undefined);
      expect(spyParseClass).not.toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});

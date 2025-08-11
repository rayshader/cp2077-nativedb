import {CodeSyntax, Settings, SettingsService} from "./settings.service";
import {StorageMock} from "../../../tests/storage.mock";
import {Injector} from "@angular/core";

describe('SettingsService', () => {
  let service: SettingsService;

  let storageMock: any;

  const createService = (): SettingsService => {
    const injector = Injector.create({
      providers: [
        { provide: SettingsService, useClass: SettingsService, deps: [] },
      ]
    });
    return injector.get(SettingsService);
  };

  beforeEach(() => {
    storageMock = StorageMock;
  });

  afterEach(() => {
    storageMock.mockResetAll();
  });

  it('should use default settings when storage is empty', () => {
    // GIVEN
    storageMock.getItem.mockReturnValue(null);

    // WHEN
    service = createService();

    // THEN
    const settings: Settings = service.settings();

    expect(service.isFirstUsage).toBeTruthy();
    expect(settings).toEqual(<Settings>{
      ignoreDuplicate: true,
      scriptOnly: false,
      scrollBehavior: 'smooth',
      showDocumentation: true,
      showMembers: false,
      formatShareLink: true,
      highlightEmptyObject: true,
      showEmptyAccordion: false,
      mergeObject: true,
      tabsWidth: 320,
      isBarPinned: true,
      clipboardSyntax: CodeSyntax.lua,
      codeSyntax: CodeSyntax.redscript
    });
  });

  it('should load settings from storage', () => {
    // GIVEN
    storageMock.mockItems({
      'first-usage': false,
      'ignore-duplicate': false,
      'script-only': false,
      'scroll-behavior': 'disabled',
      'show-documentation': false,
      'show-members': false,
      'format-share-link': false,
      'highlight-empty-object': true,
      'show-empty-accordion': true,
      'merge-object': false,
      'tabs-width': 400,
      'is-bar-pinned': false,
      'clipboard-syntax': CodeSyntax.lua,
      'code-syntax': CodeSyntax.pseudocode
    });

    // WHEN
    service = createService();

    // THEN
    const settings: Settings = service.settings();

    expect(service.isFirstUsage).toBeFalsy();
    expect(settings).toEqual(<Settings>{
      ignoreDuplicate: false,
      scriptOnly: false,
      scrollBehavior: 'disabled',
      showDocumentation: false,
      showMembers: false,
      formatShareLink: false,
      highlightEmptyObject: true,
      showEmptyAccordion: true,
      mergeObject: false,
      tabsWidth: 400,
      isBarPinned: false,
      clipboardSyntax: CodeSyntax.lua,
      codeSyntax: CodeSyntax.pseudocode
    });
  });

  it('should read individual settings from storage', () => {
    // GIVEN
    storageMock.mockItems({
      'ignore-duplicate': true,
      'script-only': true,
      'scroll-behavior': 'instant',
      'show-documentation': true,
      'show-members': true,
      'format-share-link': true,
      'highlight-empty-object': false,
      'show-empty-accordion': false,
      'merge-object': true,
      'tabs-width': 500,
      'is-bar-pinned': true,
      'clipboard-syntax': CodeSyntax.cppRedLib,
      'code-syntax': CodeSyntax.pseudocode
    });

    // WHEN
    service = createService();

    // THEN
    const settings = {
      ignoreDuplicate: service.ignoreDuplicate(),
      scriptOnly: service.scriptOnly(),
      scrollBehavior: service.scrollBehavior(),
      showDocumentation: service.showDocumentation(),
      showMembers: service.showMembers(),
      formatShareLink: service.formatShareLink(),
      highlightEmptyObject: service.highlightEmptyObject(),
      showEmptyAccordion: service.showEmptyAccordion(),
      mergeObject: service.mergeObject(),
      tabsWidth: service.tabsWidth(),
      isBarPinned: service.isBarPinned(),
      clipboardSyntax: service.clipboard(),
      codeSyntax: service.code(),
    };

    expect(settings).toEqual({
      ignoreDuplicate: true,
      scriptOnly: true,
      scrollBehavior: 'instant',
      showDocumentation: true,
      showMembers: true,
      formatShareLink: true,
      highlightEmptyObject: false,
      showEmptyAccordion: false,
      mergeObject: true,
      tabsWidth: 500,
      isBarPinned: true,
      clipboardSyntax: CodeSyntax.cppRedLib,
      codeSyntax: CodeSyntax.pseudocode
    });
  });

  describe('update actions', () => {
    const updates: any[] = [
      {name: 'ignoreDuplicate', key: 'ignore-duplicate', change: true, expect: 'true'},
      {name: 'scriptOnly', key: 'script-only', change: true, expect: 'true'},
      {name: 'scrollBehavior', key: 'scroll-behavior', change: 'auto', expect: 'auto'},
      {name: 'showDocumentation', key: 'show-documentation', change: false, expect: 'false'},
      {name: 'showMembers', key: 'show-members', change: true, expect: 'true'},
      {name: 'formatShareLink', key: 'format-share-link', change: false, expect: 'false'},
      {name: 'highlightEmptyObject', key: 'highlight-empty-object', change: false, expect: 'false'},
      {name: 'showEmptyAccordion', key: 'show-empty-accordion', change: true, expect: 'true'},
      {name: 'mergeObject', key: 'merge-object', change: false, expect: 'false'},
      {name: 'tabsWidth', key: 'tabs-width', change: 400, expect: '400'},
      {name: 'isBarPinned', key: 'is-bar-pinned', change: false, expect: 'false'},
      {name: 'clipboard', key: 'clipboard-syntax', change: CodeSyntax.lua, expect: CodeSyntax.lua.toString()},
      {name: 'code', key: 'code-syntax', change: CodeSyntax.pseudocode, expect: CodeSyntax.pseudocode.toString()},
    ];

    beforeAll(() => {
      service = createService();
    });

    for (const update of updates) {
      it(`should save and emit value of '${update.name}' when updated`, () => {
        // GIVEN
        storageMock.getItem.mockReturnValue(null);

        // WHEN
        const fn: string = `update${update.name[0].toUpperCase()}${update.name.substring(1)}`;
        // @ts-ignore
        service[fn](update.change);

        // THEN
        const getter: string = `${update.name}`;
        // @ts-ignore
        const value: any = service[getter]();

        expect(value).toEqual(update.change);
        expect(storageMock.setItem).toHaveBeenCalledWith(update.key, update.expect);
      });
    }
  });
});

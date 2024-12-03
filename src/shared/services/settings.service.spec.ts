import {CodeSyntax, Settings, SettingsService} from "./settings.service";
import {StorageMock} from "../../../tests/storage.mock";
import {combineLatest, firstValueFrom, map} from "rxjs";

describe('SettingsService', () => {
  let service: SettingsService;

  let storageMock: any;

  beforeEach(() => {
    storageMock = StorageMock;
  });

  afterEach(() => {
    storageMock.mockResetAll();
  });

  it('should use default settings when storage is empty', async () => {
    // GIVEN
    storageMock.getItem.mockReturnValue(null);

    // WHEN
    service = new SettingsService();

    // THEN
    const settings: Settings = await firstValueFrom(service.settings$);

    expect(service.isFirstUsage).toBeTruthy();
    expect(settings).toEqual(<Settings>{
      ignoreDuplicate: true,
      scriptOnly: false,
      scrollBehavior: 'smooth',
      showDocumentation: true,
      showMembers: false,
      highlightEmptyObject: true,
      showEmptyAccordion: false,
      mergeObject: true,
      tabsWidth: 320,
      isBarPinned: true,
      clipboardSyntax: CodeSyntax.lua,
      codeSyntax: CodeSyntax.redscript
    });
  });

  it('should load settings from storage', async () => {
    // GIVEN
    storageMock.mockItems({
      'first-usage': false,
      'ignore-duplicate': false,
      'script-only': false,
      'scroll-behavior': 'disabled',
      'show-documentation': false,
      'show-members': false,
      'highlight-empty-object': true,
      'show-empty-accordion': true,
      'merge-object': false,
      'tabs-width': 400,
      'is-bar-pinned': false,
      'clipboard-syntax': CodeSyntax.lua,
      'code-syntax': CodeSyntax.pseudocode
    });

    // WHEN
    service = new SettingsService();

    // THEN
    const settings: Settings = await firstValueFrom(service.settings$);

    expect(service.isFirstUsage).toBeFalsy();
    expect(settings).toEqual(<Settings>{
      ignoreDuplicate: false,
      scriptOnly: false,
      scrollBehavior: 'disabled',
      showDocumentation: false,
      showMembers: false,
      highlightEmptyObject: true,
      showEmptyAccordion: true,
      mergeObject: false,
      tabsWidth: 400,
      isBarPinned: false,
      clipboardSyntax: CodeSyntax.lua,
      codeSyntax: CodeSyntax.pseudocode
    });
  });

  it('should emit individual settings from storage', async () => {
    // GIVEN
    storageMock.mockItems({
      'ignore-duplicate': true,
      'script-only': true,
      'scroll-behavior': 'instant',
      'show-documentation': true,
      'show-members': true,
      'highlight-empty-object': false,
      'show-empty-accordion': false,
      'merge-object': true,
      'tabs-width': 500,
      'is-bar-pinned': true,
      'clipboard-syntax': CodeSyntax.cppRedLib,
      'code-syntax': CodeSyntax.pseudocode
    });

    // WHEN
    service = new SettingsService();

    // THEN
    const settings = await firstValueFrom(combineLatest([
      service.ignoreDuplicate$,
      service.scriptOnly$,
      service.scrollBehavior$,
      service.showDocumentation$,
      service.showMembers$,
      service.highlightEmptyObject$,
      service.showEmptyAccordion$,
      service.mergeObject$,
      service.tabsWidth$,
      service.isBarPinned$,
      service.clipboard$,
      service.code$,
    ]).pipe(
      map((data) => {
        return {
          ignoreDuplicate: data[0],
          scriptOnly: data[1],
          scrollBehavior: data[2],
          showDocumentation: data[3],
          showMembers: data[4],
          highlightEmptyObject: data[5],
          showEmptyAccordion: data[6],
          mergeObject: data[7],
          tabsWidth: data[8],
          isBarPinned: data[9],
          clipboardSyntax: data[10],
          codeSyntax: data[11]
        };
      })
    ));

    expect(settings).toEqual({
      ignoreDuplicate: true,
      scriptOnly: true,
      scrollBehavior: 'instant',
      showDocumentation: true,
      showMembers: true,
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
      {name: 'highlightEmptyObject', key: 'highlight-empty-object', change: false, expect: 'false'},
      {name: 'showEmptyAccordion', key: 'show-empty-accordion', change: true, expect: 'true'},
      {name: 'mergeObject', key: 'merge-object', change: false, expect: 'false'},
      {name: 'tabsWidth', key: 'tabs-width', change: 400, expect: '400'},
      {name: 'isBarPinned', key: 'is-bar-pinned', change: false, expect: 'false'},
      {name: 'clipboard', key: 'clipboard-syntax', change: CodeSyntax.lua, expect: CodeSyntax.lua.toString()},
      {name: 'code', key: 'code-syntax', change: CodeSyntax.pseudocode, expect: CodeSyntax.pseudocode.toString()},
    ];

    beforeAll(() => {
      service = new SettingsService();
    });

    for (const update of updates) {
      it(`should save and emit value of '${update.name}' when updated`, async () => {
        // GIVEN
        storageMock.getItem.mockReturnValue(null);

        // WHEN
        const fn: string = `update${update.name[0].toUpperCase()}${update.name.substring(1)}`;

        // @ts-ignore
        service[fn](update.change);

        // THEN
        const emitter: string = `${update.name}$`;

        // @ts-ignore
        const value: any = await firstValueFrom(service[emitter]);

        expect(value).toEqual(update.change);
        expect(storageMock.setItem).toHaveBeenCalledWith(update.key, update.expect);
      });
    }
  });
});

import {Injectable} from "@angular/core";
import {BehaviorSubject, combineLatest, map, Observable} from "rxjs";
import {PageScrollBehavior} from "./page.service";

export interface Settings {
  readonly ignoreDuplicate: boolean;
  readonly scriptOnly: boolean;
  readonly scrollBehavior: PageScrollBehavior;
  readonly showDocumentation: boolean;
  readonly showMembers: boolean;
  readonly formatShareLink: boolean;
  readonly highlightEmptyObject: boolean;
  readonly showEmptyAccordion: boolean;
  readonly mergeObject: boolean;
  readonly tabsWidth: number;
  readonly isBarPinned: boolean;
  readonly clipboardSyntax: CodeSyntax;
  readonly codeSyntax: CodeSyntax;
}

export enum CodeSyntax {
  pseudocode,
  redscript,
  lua,
  cppRED4ext,
  cppRedLib
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private firstUsage: boolean = true;
  private readonly ignoreDuplicateSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private readonly scriptOnlySubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly scrollBehaviorSubject: BehaviorSubject<PageScrollBehavior> = new BehaviorSubject<PageScrollBehavior>('smooth');
  private readonly showDocumentationSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private readonly showMembersSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly formatShareLinkSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private readonly highlightEmptyObjectSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private readonly showEmptyAccordionSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly mergeObjectSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private readonly tabsWidthSubject: BehaviorSubject<number> = new BehaviorSubject<number>(320);
  private readonly isBarPinnedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private readonly clipboardSubject: BehaviorSubject<CodeSyntax> = new BehaviorSubject<CodeSyntax>(CodeSyntax.lua);
  private readonly codeSubject: BehaviorSubject<CodeSyntax> = new BehaviorSubject<CodeSyntax>(CodeSyntax.redscript);

  /**
   * Whether this application is used for the first time on this device?
   */
  get isFirstUsage(): boolean {
    return this.firstUsage;
  }

  /**
   * Whether duplicate operators/casts in global functions should be ignored (hidden)?
   */
  readonly ignoreDuplicate$: Observable<boolean> = this.ignoreDuplicateSubject.asObservable();

  /**
   * Whether only Redscript definitions should be visible?
   */
  readonly scriptOnly$: Observable<boolean> = this.scriptOnlySubject.asObservable();

  /**
   * Which scrolling behavior should be used when navigating to a new page?
   */
  readonly scrollBehavior$: Observable<PageScrollBehavior> = this.scrollBehaviorSubject.asObservable();

  /**
   * Whether documented properties/functions should be visible?
   */
  readonly showDocumentation$: Observable<boolean> = this.showDocumentationSubject.asObservable();

  /**
   * Whether members of parents should be visible?
   */
  readonly showMembers$: Observable<boolean> = this.showMembersSubject.asObservable();

  /**
   * Whether share links should use Markdown format?
   */
  readonly formatShareLink$: Observable<boolean> = this.formatShareLinkSubject.asObservable();

  /**
   * Whether empty class/struct should be highlighted?
   */
  readonly highlightEmptyObject$: Observable<boolean> = this.highlightEmptyObjectSubject.asObservable();

  /**
   * Whether empty accordions of an object should be visible?
   */
  readonly showEmptyAccordion$: Observable<boolean> = this.showEmptyAccordionSubject.asObservable();

  /**
   * Whether classes and structs should be listed in one tab?
   */
  readonly mergeObject$: Observable<boolean> = this.mergeObjectSubject.asObservable();

  /**
   * Width of the <ndb-tabs> panel (in pixels).
   */
  readonly tabsWidth$: Observable<number> = this.tabsWidthSubject.asObservable();

  /**
   * Whether title bar of a page must be pinned at the top when scrolling?
   */
  readonly isBarPinned$: Observable<boolean> = this.isBarPinnedSubject.asObservable();

  /**
   * Which code syntax must be used when copying code to the clipboard?
   */
  readonly clipboard$: Observable<CodeSyntax> = this.clipboardSubject.asObservable();

  /**
   * Which code syntax must be used when formatting functions and properties?
   */
  readonly code$: Observable<CodeSyntax> = this.codeSubject.asObservable();

  constructor() {
    this.firstUsage = (localStorage.getItem('first-usage') ?? 'true') === 'true';
    const ignoreDuplicate: boolean = (localStorage.getItem('ignore-duplicate') ?? 'true') === 'true';
    const scriptOnly: boolean = (localStorage.getItem('script-only') ?? 'false') === 'true';
    const scrollBehavior: PageScrollBehavior = (localStorage.getItem('scroll-behavior') ?? 'smooth') as PageScrollBehavior;
    const showDocumentation: boolean = (localStorage.getItem('show-documentation') ?? 'true') === 'true';
    const showMembers: boolean = (localStorage.getItem('show-members') ?? 'false') === 'true';
    const formatShareLink: boolean = (localStorage.getItem('format-share-link') ?? 'true') === 'true';
    const highlightEmptyObject: boolean = (localStorage.getItem('highlight-empty-object') ?? 'true') === 'true';
    const showEmptyAccordion: boolean = (localStorage.getItem('show-empty-accordion') ?? 'false') === 'true';
    const mergeObject: boolean = (localStorage.getItem('merge-object') ?? 'true') === 'true';
    const tabsWidth: number = +(localStorage.getItem('tabs-width') ?? '320');
    const isBarPinned: boolean = (localStorage.getItem('is-bar-pinned') ?? 'true') === 'true';
    const clipboard: string = localStorage.getItem('clipboard-syntax') ?? CodeSyntax.lua.toString();
    const code: string = localStorage.getItem('code-syntax') ?? CodeSyntax.redscript.toString();

    this.ignoreDuplicateSubject.next(ignoreDuplicate);
    this.scriptOnlySubject.next(scriptOnly);
    this.scrollBehaviorSubject.next(scrollBehavior);
    this.showDocumentationSubject.next(showDocumentation);
    this.showMembersSubject.next(showMembers);
    this.formatShareLinkSubject.next(formatShareLink);
    this.highlightEmptyObjectSubject.next(highlightEmptyObject);
    this.showEmptyAccordionSubject.next(showEmptyAccordion);
    this.mergeObjectSubject.next(mergeObject);
    this.tabsWidthSubject.next(tabsWidth);
    this.isBarPinnedSubject.next(isBarPinned);
    this.clipboardSubject.next(+clipboard);
    this.codeSubject.next(+code);
  }

  get settings$(): Observable<Settings> {
    return combineLatest([
      this.ignoreDuplicate$,
      this.scriptOnly$,
      this.scrollBehavior$,
      this.showDocumentation$,
      this.showMembers$,
      this.formatShareLink$,
      this.highlightEmptyObject$,
      this.showEmptyAccordion$,
      this.mergeObject$,
      this.tabsWidth$,
      this.isBarPinned$,
      this.clipboard$,
      this.code$
    ])
      .pipe(
        map(([
               ignoreDuplicate,
               scriptOnly,
               scrollBehavior,
               showDocumentation,
               showMembers,
               formatShareLink,
               highlightEmptyObject,
               showEmptyAccordion,
               mergeObject,
               tabsWidth,
               isBarPinned,
               clipboard,
               code
             ]) => {
          return {
            ignoreDuplicate: ignoreDuplicate,
            scriptOnly: scriptOnly,
            scrollBehavior: scrollBehavior,
            showDocumentation: showDocumentation,
            showMembers: showMembers,
            formatShareLink: formatShareLink,
            highlightEmptyObject: highlightEmptyObject,
            showEmptyAccordion: showEmptyAccordion,
            mergeObject: mergeObject,
            tabsWidth: tabsWidth,
            isBarPinned: isBarPinned,
            clipboardSyntax: clipboard,
            codeSyntax: code
          };
        })
      );
  }

  toggleFirstUsage(): void {
    if (!this.firstUsage) {
      return;
    }
    this.firstUsage = false;
    localStorage.setItem('first-usage', 'false');
  }

  updateIgnoreDuplicate(state: boolean): void {
    localStorage.setItem('ignore-duplicate', `${state}`);
    this.ignoreDuplicateSubject.next(state);
  }

  updateScriptOnly(state: boolean): void {
    localStorage.setItem('script-only', `${state}`);
    this.scriptOnlySubject.next(state);
  }

  updateScrollBehavior(behavior: PageScrollBehavior): void {
    localStorage.setItem('scroll-behavior', behavior);
    this.scrollBehaviorSubject.next(behavior);
  }

  updateShowDocumentation(state: boolean): void {
    localStorage.setItem('show-documentation', `${state}`);
    this.showDocumentationSubject.next(state);
  }

  updateShowMembers(state: boolean): void {
    localStorage.setItem('show-members', `${state}`);
    this.showMembersSubject.next(state);
  }

  updateFormatShareLink(state: boolean): void {
    localStorage.setItem('format-share-link', `${state}`);
    this.formatShareLinkSubject.next(state);
  }

  updateHighlightEmptyObject(state: boolean): void {
    localStorage.setItem('highlight-empty-object', `${state}`);
    this.highlightEmptyObjectSubject.next(state);
  }

  updateShowEmptyAccordion(state: boolean): void {
    localStorage.setItem('show-empty-accordion', `${state}`);
    this.showEmptyAccordionSubject.next(state);
  }

  updateMergeObject(state: boolean): void {
    localStorage.setItem('merge-object', `${state}`);
    this.mergeObjectSubject.next(state);
  }

  updateTabsWidth(width: number): void {
    localStorage.setItem('tabs-width', width.toString());
    this.tabsWidthSubject.next(width);
  }

  updateIsBarPinned(state: boolean): void {
    localStorage.setItem('is-bar-pinned', `${state}`);
    this.isBarPinnedSubject.next(state);
  }

  updateClipboard(syntax: CodeSyntax): void {
    localStorage.setItem('clipboard-syntax', syntax.toString());
    this.clipboardSubject.next(syntax);
  }

  updateCode(syntax: CodeSyntax): void {
    localStorage.setItem('code-syntax', syntax.toString());
    this.codeSubject.next(syntax);
  }

}

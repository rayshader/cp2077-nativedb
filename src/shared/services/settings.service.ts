import {computed, Injectable, Signal, signal} from "@angular/core";
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

  private readonly currentIgnoreDuplicate = signal<boolean>(true);
  private readonly currentScriptOnly = signal<boolean>(false);
  private readonly currentScrollBehavior = signal<PageScrollBehavior>('smooth');
  private readonly currentShowDocumentation = signal<boolean>(true);
  private readonly currentShowMembers = signal<boolean>(false);
  private readonly currentFormatShareLink = signal<boolean>(true);
  private readonly currentHighlightEmptyObject = signal<boolean>(true);
  private readonly currentShowEmptyAccordion = signal<boolean>(false);
  private readonly currentMergeObject = signal<boolean>(true);
  private readonly currentTabsWidth = signal<number>(320);
  private readonly currentIsBarPinned = signal<boolean>(true);
  private readonly currentClipboard = signal<CodeSyntax>(CodeSyntax.lua);
  private readonly currentCode = signal<CodeSyntax>(CodeSyntax.redscript);

  readonly settings = computed<Settings>(() => {
    return {
      ignoreDuplicate: this.currentIgnoreDuplicate(),
      scriptOnly: this.currentScriptOnly(),
      scrollBehavior: this.currentScrollBehavior(),
      showDocumentation: this.currentShowDocumentation(),
      showMembers: this.currentShowMembers(),
      formatShareLink: this.currentFormatShareLink(),
      highlightEmptyObject: this.currentHighlightEmptyObject(),
      showEmptyAccordion: this.currentShowEmptyAccordion(),
      mergeObject: this.currentMergeObject(),
      tabsWidth: this.currentTabsWidth(),
      isBarPinned: this.currentIsBarPinned(),
      clipboardSyntax: this.currentClipboard(),
      codeSyntax: this.currentCode()
    }
  });

  /**
   * Whether this application is used for the first time on this device?
   */
  get isFirstUsage(): boolean {
    return this.firstUsage;
  }

  /**
   * Whether duplicate operators/casts in global functions should be ignored (hidden)?
   */
  get ignoreDuplicate(): Signal<boolean> {
    return this.currentIgnoreDuplicate;
  }

  /**
   * Whether only Redscript definitions should be visible?
   */
  get scriptOnly(): Signal<boolean> {
    return this.currentScriptOnly;
  }

  /**
   * Which scrolling behavior should be used when navigating to a new page?
   */
  get scrollBehavior(): Signal<PageScrollBehavior> {
    return this.currentScrollBehavior;
  }

  /**
   * Whether documented properties/functions should be visible?
   */
  get showDocumentation(): Signal<boolean> {
    return this.currentShowDocumentation;
  }

  /**
   * Whether members of parents should be visible?
   */
  get showMembers(): Signal<boolean> {
    return this.currentShowMembers;
  }

  /**
   * Whether share links should use a Markdown format?
   */
  get formatShareLink(): Signal<boolean> {
    return this.currentFormatShareLink;
  }

  /**
   * Whether an empty class / struct should be highlighted?
   */
  get highlightEmptyObject(): Signal<boolean> {
    return this.currentHighlightEmptyObject;
  }

  /**
   * Whether empty accordions of an object should be visible?
   */
  get showEmptyAccordion(): Signal<boolean> {
    return this.currentShowEmptyAccordion;
  }

  /**
   * Whether classes and structs should be listed in one tab?
   */
  get mergeObject(): Signal<boolean> {
    return this.currentMergeObject;
  }

  /**
   * Width of the <ndb-tabs> panel (in pixels).
   */
  get tabsWidth(): Signal<number> {
    return this.currentTabsWidth;
  }

  /**
   * Whether the title bar of a page must be pinned at the top when scrolling?
   */
  get isBarPinned(): Signal<boolean> {
    return this.currentIsBarPinned;
  }

  /**
   * Which code syntax must be used when copying code to the clipboard?
   */
  get clipboard(): Signal<CodeSyntax> {
    return this.currentClipboard;
  }

  /**
   * Which code syntax must be used when formatting functions and properties?
   */
  get code(): Signal<CodeSyntax> {
    return this.currentCode;
  }

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

    this.currentIgnoreDuplicate.set(ignoreDuplicate);
    this.currentScriptOnly.set(scriptOnly);
    this.currentScrollBehavior.set(scrollBehavior);
    this.currentShowDocumentation.set(showDocumentation);
    this.currentShowMembers.set(showMembers);
    this.currentFormatShareLink.set(formatShareLink);
    this.currentHighlightEmptyObject.set(highlightEmptyObject);
    this.currentShowEmptyAccordion.set(showEmptyAccordion);
    this.currentMergeObject.set(mergeObject);
    this.currentTabsWidth.set(tabsWidth);
    this.currentIsBarPinned.set(isBarPinned);
    this.currentClipboard.set(+clipboard);
    this.currentCode.set(+code);
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
    this.currentIgnoreDuplicate.set(state);
  }

  updateScriptOnly(state: boolean): void {
    localStorage.setItem('script-only', `${state}`);
    this.currentScriptOnly.set(state);
  }

  updateScrollBehavior(behavior: PageScrollBehavior): void {
    localStorage.setItem('scroll-behavior', behavior);
    this.currentScrollBehavior.set(behavior);
  }

  updateShowDocumentation(state: boolean): void {
    localStorage.setItem('show-documentation', `${state}`);
    this.currentShowDocumentation.set(state);
  }

  updateShowMembers(state: boolean): void {
    localStorage.setItem('show-members', `${state}`);
    this.currentShowMembers.set(state);
  }

  updateFormatShareLink(state: boolean): void {
    localStorage.setItem('format-share-link', `${state}`);
    this.currentFormatShareLink.set(state);
  }

  updateHighlightEmptyObject(state: boolean): void {
    localStorage.setItem('highlight-empty-object', `${state}`);
    this.currentHighlightEmptyObject.set(state);
  }

  updateShowEmptyAccordion(state: boolean): void {
    localStorage.setItem('show-empty-accordion', `${state}`);
    this.currentShowEmptyAccordion.set(state);
  }

  updateMergeObject(state: boolean): void {
    localStorage.setItem('merge-object', `${state}`);
    this.currentMergeObject.set(state);
  }

  updateTabsWidth(width: number): void {
    localStorage.setItem('tabs-width', width.toString());
    this.currentTabsWidth.set(width);
  }

  updateIsBarPinned(state: boolean): void {
    localStorage.setItem('is-bar-pinned', `${state}`);
    this.currentIsBarPinned.set(state);
  }

  updateClipboard(syntax: CodeSyntax): void {
    localStorage.setItem('clipboard-syntax', syntax.toString());
    this.currentClipboard.set(syntax);
  }

  updateCode(syntax: CodeSyntax): void {
    localStorage.setItem('code-syntax', syntax.toString());
    this.currentCode.set(syntax);
  }

}

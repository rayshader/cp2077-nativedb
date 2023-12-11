import {Injectable} from "@angular/core";
import {BehaviorSubject, combineLatest, map, Observable} from "rxjs";
import {PageScrollBehavior} from "./page.service";

export interface Settings {
  readonly ignoreDuplicate: boolean;
  readonly scrollBehavior: PageScrollBehavior;
  readonly highlightEmptyObject: boolean;
  readonly showEmptyAccordion: boolean;
  readonly mergeObject: boolean;
  readonly tabsWidth: number;
  readonly clipboardSyntax: CodeSyntax;
  readonly codeSyntax: CodeSyntax;
}

export enum CodeSyntax {
  vanilla,
  redscript,
  lua,
  cppRED4ext,
  cppRedLib
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private readonly ignoreDuplicateSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  /**
   * Whether duplicate operators/casts in global functions should be ignored (hidden)?
   */
  readonly ignoreDuplicate$: Observable<boolean> = this.ignoreDuplicateSubject.asObservable();
  private readonly scrollBehaviorSubject: BehaviorSubject<PageScrollBehavior> = new BehaviorSubject<PageScrollBehavior>('smooth');
  /**
   * Which scrolling behavior should be used when navigating to a new page?
   */
  readonly scrollBehavior$: Observable<PageScrollBehavior> = this.scrollBehaviorSubject.asObservable();
  private readonly highlightEmptyObjectSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  /**
   * Whether empty class/struct should be highlighted?
   */
  readonly highlightEmptyObject$: Observable<boolean> = this.highlightEmptyObjectSubject.asObservable();
  private readonly showEmptyAccordionSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  /**
   * Whether empty accordions of an object should be visible?
   */
  readonly showEmptyAccordion$: Observable<boolean> = this.showEmptyAccordionSubject.asObservable();
  private readonly mergeObjectSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  /**
   * Whether classes and structs should be listed in one tab?
   */
  readonly mergeObject$: Observable<boolean> = this.mergeObjectSubject.asObservable();
  private readonly tabsWidthSubject: BehaviorSubject<number> = new BehaviorSubject<number>(320);
  /**
   * Width of the <ndb-tabs> panel (in pixels).
   */
  readonly tabsWidth$: Observable<number> = this.tabsWidthSubject.asObservable();
  private readonly clipboardSubject: BehaviorSubject<CodeSyntax> = new BehaviorSubject<CodeSyntax>(CodeSyntax.redscript);
  /**
   * Which code syntax must be used when copying code to the clipboard?
   */
  readonly clipboard$: Observable<CodeSyntax> = this.clipboardSubject.asObservable();
  private readonly codeSubject: BehaviorSubject<CodeSyntax> = new BehaviorSubject<CodeSyntax>(CodeSyntax.redscript);
  /**
   * Which code syntax must be used when formatting functions and properties?
   */
  readonly code$: Observable<CodeSyntax> = this.codeSubject.asObservable();

  constructor() {
    const ignoreDuplicate: boolean = (localStorage.getItem('ignore-duplicate') ?? 'true') === 'true';
    const scrollBehavior: PageScrollBehavior = (localStorage.getItem('scroll-behavior') ?? 'smooth') as PageScrollBehavior;
    const highlightEmptyObject: boolean = (localStorage.getItem('highlight-empty-object') ?? 'true') === 'true';
    const showEmptyAccordion: boolean = (localStorage.getItem('show-empty-accordion') ?? 'false') === 'true';
    const mergeObject: boolean = (localStorage.getItem('merge-object') ?? 'false') === 'true';
    const tabsWidth: number = +(localStorage.getItem('tabs-width') ?? '320');
    const clipboard: string = localStorage.getItem('clipboard-syntax') ?? CodeSyntax.redscript.toString();
    const code: string = localStorage.getItem('code-syntax') ?? CodeSyntax.redscript.toString();

    this.ignoreDuplicateSubject.next(ignoreDuplicate);
    this.scrollBehaviorSubject.next(scrollBehavior);
    this.highlightEmptyObjectSubject.next(highlightEmptyObject);
    this.showEmptyAccordionSubject.next(showEmptyAccordion);
    this.mergeObjectSubject.next(mergeObject);
    this.tabsWidthSubject.next(tabsWidth);
    this.clipboardSubject.next(+clipboard);
    this.codeSubject.next(+code);
  }

  get settings$(): Observable<Settings> {
    return combineLatest([
      this.ignoreDuplicate$,
      this.scrollBehavior$,
      this.highlightEmptyObject$,
      this.showEmptyAccordion$,
      this.mergeObject$,
      this.tabsWidth$,
      this.clipboard$,
      this.code$
    ])
      .pipe(
        map(([
               ignoreDuplicate,
               scrollBehavior,
               highlightEmptyObject,
               showEmptyAccordion,
               mergeObject,
               tabsWidth,
               clipboard,
               code
             ]) => {
          return {
            ignoreDuplicate: ignoreDuplicate,
            scrollBehavior: scrollBehavior,
            highlightEmptyObject: highlightEmptyObject,
            showEmptyAccordion: showEmptyAccordion,
            mergeObject: mergeObject,
            tabsWidth: tabsWidth,
            clipboardSyntax: clipboard,
            codeSyntax: code
          };
        })
      );
  }

  updateIgnoreDuplicate(state: boolean): void {
    localStorage.setItem('ignore-duplicate', `${state}`);
    this.ignoreDuplicateSubject.next(state);
  }

  updateScrollBehavior(behavior: PageScrollBehavior): void {
    localStorage.setItem('scroll-behavior', behavior);
    this.scrollBehaviorSubject.next(behavior);
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

  updateClipboard(syntax: CodeSyntax): void {
    localStorage.setItem('clipboard-syntax', syntax.toString());
    this.clipboardSubject.next(syntax);
  }

  updateCode(syntax: CodeSyntax): void {
    localStorage.setItem('code-syntax', syntax.toString());
    this.codeSubject.next(syntax);
  }

}

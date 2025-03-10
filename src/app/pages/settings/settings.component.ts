import {Component, DestroyRef, OnInit} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {combineLatest} from "rxjs";
import {MatDividerModule} from "@angular/material/divider";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {CodeSyntax, Settings, SettingsService} from "../../../shared/services/settings.service";
import {PageScrollBehavior} from "../../../shared/services/page.service";

interface AItem<T> {
  readonly value: T;
  readonly name: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'ndb-page-settings',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatSlideToggleModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {

  readonly clipboardOptions: AItem<CodeSyntax>[] = [
    {value: CodeSyntax.redscript, name: 'Redscript', disabled: false},
    {value: CodeSyntax.lua, name: 'Lua · CET', disabled: false},
    {value: CodeSyntax.cppRedLib, name: 'C++ · RedLib', disabled: false},
  ];

  readonly codeOptions: AItem<CodeSyntax>[] = [
    {value: CodeSyntax.pseudocode, name: 'Pseudocode · Legacy', disabled: false},
    {value: CodeSyntax.redscript, name: 'Redscript', disabled: false},
    //{value: CodeSyntax.cppRED4ext, name: 'C++ · RED4ext / RedLib', disabled: false}
  ];

  readonly ignoreDuplicate: FormControl<boolean | null> = new FormControl(true);
  readonly scriptOnly: FormControl<boolean | null> = new FormControl(false);
  readonly scrollBehavior: FormControl<PageScrollBehavior | null> = new FormControl('smooth');
  readonly showDocumentation: FormControl<boolean | null> = new FormControl(true);
  readonly showMembers: FormControl<boolean | null> = new FormControl(false);
  readonly formatShareLink: FormControl<boolean | null> = new FormControl(true);
  readonly highlightEmptyObject: FormControl<boolean | null> = new FormControl(true);
  readonly showEmptyAccordion: FormControl<boolean | null> = new FormControl(false);
  readonly mergeObject: FormControl<boolean | null> = new FormControl(false);
  readonly clipboardSyntax: FormControl<CodeSyntax | null> = new FormControl(CodeSyntax.lua);
  readonly codeSyntax: FormControl<CodeSyntax | null> = new FormControl(CodeSyntax.redscript);

  constructor(private readonly settingsService: SettingsService,
              private readonly dr: DestroyRef) {
  }

  ngOnInit(): void {
    this.settingsService.settings$.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onSettingsLoaded.bind(this));
    combineLatest([this.settingsService.clipboard$, this.settingsService.code$])
      .pipe(takeUntilDestroyed(this.dr))
      .subscribe(this.onSyntaxChanged.bind(this));

    this.ignoreDuplicate.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onIgnoreDuplicateChanged.bind(this));
    this.scriptOnly.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onScriptOnlyChanged.bind(this));
    this.scrollBehavior.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onScrollBehaviorChanged.bind(this));
    this.showDocumentation.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onShowDocumentationChanged.bind(this));
    this.showMembers.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onShowMembersChanged.bind(this));
    this.formatShareLink.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onFormatShareLinkChanged.bind(this));
    this.highlightEmptyObject.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onHighlightEmptyObjectChanged.bind(this));
    this.showEmptyAccordion.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onShowEmptyAccordionChanged.bind(this));
    this.mergeObject.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onMergeObjectChanged.bind(this));
    this.clipboardSyntax.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onClipboardSyntaxSelected.bind(this));
    this.codeSyntax.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onCodeSyntaxSelected.bind(this));
  }

  private onIgnoreDuplicateChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateIgnoreDuplicate(state);
  }

  private onScriptOnlyChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateScriptOnly(state);
  }

  private onScrollBehaviorChanged(behavior: ScrollBehavior | 'disabled' | null): void {
    if (!behavior) {
      return;
    }
    this.settingsService.updateScrollBehavior(behavior);
  }

  private onShowMembersChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateShowMembers(state);
  }

  private onFormatShareLinkChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateFormatShareLink(state);
  }

  private onShowDocumentationChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateShowDocumentation(state);
  }

  private onHighlightEmptyObjectChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateHighlightEmptyObject(state);
  }

  private onShowEmptyAccordionChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateShowEmptyAccordion(state);
  }

  private onMergeObjectChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateMergeObject(state);
  }

  private onClipboardSyntaxSelected(syntax: CodeSyntax | null): void {
    if (syntax === null) {
      return;
    }
    this.settingsService.updateClipboard(syntax);
  }

  private onCodeSyntaxSelected(syntax: CodeSyntax | null): void {
    if (syntax === null) {
      return;
    }
    this.settingsService.updateCode(syntax);
  }

  private onSettingsLoaded(settings: Settings): void {
    this.ignoreDuplicate.setValue(settings.ignoreDuplicate, {emitEvent: false});
    this.scriptOnly.setValue(settings.scriptOnly, {emitEvent: false});
    this.scrollBehavior.setValue(settings.scrollBehavior, {emitEvent: false});
    this.showDocumentation.setValue(settings.showDocumentation, {emitEvent: false});
    this.showMembers.setValue(settings.showMembers, {emitEvent: false});
    this.formatShareLink.setValue(settings.formatShareLink, {emitEvent: false});
    this.highlightEmptyObject.setValue(settings.highlightEmptyObject, {emitEvent: false});
    this.showEmptyAccordion.setValue(settings.showEmptyAccordion, {emitEvent: false});
    this.mergeObject.setValue(settings.mergeObject, {emitEvent: false});
  }

  private onSyntaxChanged([clipboard, code]: [CodeSyntax, CodeSyntax]): void {
    this.clipboardSyntax.setValue(clipboard, {emitEvent: false});
    this.codeSyntax.setValue(code, {emitEvent: false});
  }

}

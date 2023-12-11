import {Component, DestroyRef, OnInit} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {take} from "rxjs";
import {MatDividerModule} from "@angular/material/divider";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {CodeSyntax, Settings, SettingsService} from "../../../shared/services/settings.service";

interface AItem<T> {
  readonly value: T;
  readonly name: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'settings',
  standalone: true,
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

  readonly syntax: AItem<CodeSyntax>[] = [
    {value: CodeSyntax.redscript, name: 'Red · Scripts', disabled: false},
    {value: CodeSyntax.lua, name: 'Lua · CET', disabled: true},
    {value: CodeSyntax.cppRED4ext, name: 'C++ · RED4ext', disabled: true},
    {value: CodeSyntax.cppRedLib, name: 'C++ · RedLib', disabled: true},
  ];

  readonly ignoreDuplicate: FormControl<boolean | null> = new FormControl(true);
  readonly scrollBehavior: FormControl<ScrollBehavior | 'disabled' | null> = new FormControl('smooth');
  readonly highlightEmptyObject: FormControl<boolean | null> = new FormControl(true);
  readonly clipboardSyntax: FormControl<CodeSyntax | null> = new FormControl(CodeSyntax.redscript);
  readonly codeSyntax: FormControl<CodeSyntax | null> = new FormControl(CodeSyntax.redscript);

  constructor(private readonly settingsService: SettingsService,
              private readonly dr: DestroyRef) {
  }

  ngOnInit(): void {
    this.settingsService.settings$.pipe(take(1), takeUntilDestroyed(this.dr)).subscribe(this.onSettingsLoaded.bind(this));

    this.ignoreDuplicate.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onIgnoreDuplicateChanged.bind(this));
    this.scrollBehavior.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onScrollBehaviorChanged.bind(this));
    this.highlightEmptyObject.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onHighlightEmptyObjectChanged.bind(this));
    this.clipboardSyntax.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onClipboardSyntaxSelected.bind(this));
    this.codeSyntax.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onCodeSyntaxSelected.bind(this));
  }

  private onIgnoreDuplicateChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateIgnoreDuplicate(state);
  }

  private onScrollBehaviorChanged(behavior: ScrollBehavior | 'disabled' | null): void {
    if (!behavior) {
      return;
    }
    this.settingsService.updateScrollBehavior(behavior);
  }

  private onHighlightEmptyObjectChanged(state: boolean | null): void {
    if (state === null) {
      return;
    }
    this.settingsService.updateHighlightEmptyObject(state);
  }

  private onClipboardSyntaxSelected(syntax: CodeSyntax | null): void {
    if (!syntax) {
      return;
    }
    this.settingsService.updateClipboard(syntax);
  }

  private onCodeSyntaxSelected(syntax: CodeSyntax | null): void {
    if (!syntax) {
      return;
    }
    this.settingsService.updateCode(syntax);
  }

  private onSettingsLoaded(settings: Settings): void {
    this.ignoreDuplicate.setValue(settings.ignoreDuplicate, {emitEvent: false});
    this.scrollBehavior.setValue(settings.scrollBehavior, {emitEvent: false});
    this.highlightEmptyObject.setValue(settings.highlightEmptyObject, {emitEvent: false});
    this.clipboardSyntax.setValue(settings.clipboardSyntax, {emitEvent: false});
    this.codeSyntax.setValue(settings.codeSyntax, {emitEvent: false});
  }

}

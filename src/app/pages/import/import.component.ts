import {Component, DestroyRef, OnDestroy} from '@angular/core';
import {MatDividerModule} from "@angular/material/divider";
import {
  ClassDocumentation,
  ClassMergeOperation,
  DocumentationService,
  MemberMergeOperation,
  MergeBehavior
} from "../../../shared/services/documentation.service";
import {Router, RouterLink} from "@angular/router";
import {BehaviorSubject, combineLatest, map, Observable, OperatorFunction, pipe, shareReplay, switchMap} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {
  NDBMergeDocumentationComponent
} from "../../components/ndb-merge-documentation/ndb-merge-documentation.component";
import {MatButtonModule} from "@angular/material/button";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";

interface ActionsData {
  readonly isIdentical: boolean;
  readonly hasConflicts: boolean;
}

interface BehaviorItem {
  readonly value: MergeBehavior;
  readonly text: string;
}

@Component({
  selector: 'import',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    MatSelectModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    CdkAccordionModule,
    ReactiveFormsModule,
    NDBMergeDocumentationComponent
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.scss'
})
export class ImportComponent implements OnDestroy {

  readonly behaviors: BehaviorItem[] = [
    {value: MergeBehavior.manually, text: 'Manually'},
    {value: MergeBehavior.add, text: 'Accept additions'},
    {value: MergeBehavior.addAndUpdate, text: 'Accept additions and modifications'},
    {value: MergeBehavior.addAndDelete, text: 'Accept additions and deletions'},
  ];
  readonly form: FormGroup = new FormGroup({
    behavior: new FormControl<MergeBehavior | null>(null)
  });

  readonly operations$: Observable<ClassMergeOperation[]>;
  readonly data$: Observable<ActionsData>;

  isUpdated: boolean = false;

  private readonly file: ClassDocumentation[];
  private readonly isIdentical$: Observable<boolean>;
  private readonly hasConflicts$: Observable<boolean>;
  private readonly updatedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  private readonly updated$: Observable<void> = this.updatedSubject.asObservable();

  private get behavior$(): Observable<MergeBehavior> {
    return this.form.get('behavior')!.valueChanges;
  }

  constructor(private readonly documentationService: DocumentationService,
              private readonly toast: MatSnackBar,
              private readonly router: Router,
              private readonly dr: DestroyRef) {
    this.file = this.router.getCurrentNavigation()!.extras.state as ClassDocumentation[];
    this.operations$ = this.behavior$.pipe(this.buildMergeOperations());
    this.isIdentical$ = this.operations$.pipe(this.isIdentical());
    this.hasConflicts$ = combineLatest([this.operations$, this.updated$]).pipe(this.hasConflicts());
    this.data$ = combineLatest([this.isIdentical$, this.hasConflicts$]).pipe(this.buildData());
  }

  ngOnDestroy(): void {
    this.updatedSubject.complete();
  }

  merge(): void {
    combineLatest([
      this.operations$,
      this.documentationService.getAll()
    ]).pipe(
      switchMap(([operations, classes]) => {
        return this.documentationService.merge(operations, classes);
      }),
      takeUntilDestroyed(this.dr)
    ).subscribe({
      next: this.onMerged.bind(this),
      error: this.onMergeFailed.bind(this)
    });
  }

  replaceAll(): void {
    this.documentationService
      .replaceAll(this.file)
      .pipe(takeUntilDestroyed(this.dr))
      .subscribe({
        next: this.onMerged.bind(this),
        error: this.onMergeFailed.bind(this)
      });
  }

  onUpdated(): void {
    this.updatedSubject.next();
    if (this.isUpdated) {
      return;
    }
    this.isUpdated = true;
    this.form.get('behavior')!.disable({emitEvent: false});
  }

  private onMerged(): void {
    this.toast.open(
      'Your documentation is now up to date with the file.',
      undefined,
      {duration: 3000}
    );
    this.router.navigate(['']);
  }

  private onMergeFailed(): void {
    this.toast.open(
      'Merging documentation failed! Please report this issue.',
      undefined,
      {duration: 3000}
    );
    this.router.navigate(['']);
  }

  private buildData(): OperatorFunction<[boolean, boolean], ActionsData> {
    return pipe(
      map(([isIdentical, hasConflicts]) => {
        return {
          isIdentical: isIdentical,
          hasConflicts: hasConflicts
        };
      })
    );
  }

  private isIdentical(): OperatorFunction<ClassMergeOperation[], boolean> {
    return pipe(
      map((operations) => operations.length === 0)
    );
  }

  private hasConflicts(): OperatorFunction<[ClassMergeOperation[], void], boolean> {
    return pipe(
      map(([operations,]) => operations.some(this.hasClassConflict.bind(this)))
    );
  }

  private buildMergeOperations(): OperatorFunction<MergeBehavior, ClassMergeOperation[]> {
    return pipe(
      switchMap((behavior) => this.documentationService.prepareMerge(this.file, behavior)),
      shareReplay()
    );
  }

  private hasClassConflict(object: ClassMergeOperation): boolean {
    if (object.body && object.body.from === undefined) {
      return true;
    }
    return this.hasMembersConflict(object.members);
  }

  private hasMembersConflict(members?: MemberMergeOperation[]): boolean {
    if (!members) {
      return false;
    }
    return members.some((member) => member.from === undefined);
  }

}

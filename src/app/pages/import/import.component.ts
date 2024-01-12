import {Component, DestroyRef, OnDestroy} from '@angular/core';
import {MatDividerModule} from "@angular/material/divider";
import {
  ClassDocumentation,
  ClassMergeOperation,
  DocumentationService,
  MemberMergeOperation
} from "../../../shared/services/documentation.service";
import {Router, RouterLink} from "@angular/router";
import {BehaviorSubject, combineLatest, EMPTY, map, Observable, shareReplay, switchMap} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {
  NDBMergeDocumentationComponent
} from "../../components/ndb-merge-documentation/ndb-merge-documentation.component";
import {MatButtonModule} from "@angular/material/button";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatSnackBar} from "@angular/material/snack-bar";

interface ActionsData {
  readonly isIdentical: boolean;
  readonly hasConflicts: boolean;
}

@Component({
  selector: 'import',
  standalone: true,
  imports: [
    AsyncPipe,
    CdkAccordionModule,
    MatDividerModule,
    NDBMergeDocumentationComponent,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.scss'
})
export class ImportComponent implements OnDestroy {

  readonly operations$: Observable<ClassMergeOperation[]>;
  readonly data$: Observable<ActionsData> = EMPTY;

  private readonly file: ClassDocumentation[];
  private readonly isIdentical$: Observable<boolean>;
  private readonly hasConflicts$: Observable<boolean>;
  private readonly updatedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  private readonly updated$: Observable<void> = this.updatedSubject.asObservable();

  constructor(private readonly documentationService: DocumentationService,
              private readonly toast: MatSnackBar,
              private readonly router: Router,
              private readonly dr: DestroyRef) {
    this.file = this.router.getCurrentNavigation()!.extras.state as ClassDocumentation[];
    this.operations$ = this.documentationService.prepareMerge(this.file).pipe(shareReplay());
    this.isIdentical$ = this.operations$.pipe(map(this.isIdentical.bind(this)));
    this.hasConflicts$ = combineLatest([
      this.operations$,
      this.updated$
    ]).pipe(
      map(([operations,]) => operations.some(this.hasClassConflict.bind(this)))
    );
    this.data$ = combineLatest([
      this.isIdentical$,
      this.hasConflicts$
    ]).pipe(map(this.buildData.bind(this)));
    this.updatedSubject.next();
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

  private buildData([isIdentical, hasConflicts]: [boolean, boolean]): ActionsData {
    return {
      isIdentical: isIdentical,
      hasConflicts: hasConflicts
    };
  }

  private isIdentical(operations: ClassMergeOperation[]): boolean {
    return operations.length === 0;
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

import {Component} from '@angular/core';
import {MatDividerModule} from "@angular/material/divider";
import {
  ClassDocumentation,
  ClassMergeOperation,
  DocumentationService,
  MemberMergeOperation
} from "../../../shared/services/documentation.service";
import {Router} from "@angular/router";
import {BehaviorSubject, combineLatest, map, Observable, of, shareReplay} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {
  NDBMergeDocumentationComponent
} from "../../components/ndb-merge-documentation/ndb-merge-documentation.component";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'import',
  standalone: true,
  imports: [
    AsyncPipe,
    CdkAccordionModule,
    MatDividerModule,
    NDBMergeDocumentationComponent,
    MatButtonModule
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.scss'
})
export class ImportComponent {

  readonly operations$: Observable<ClassMergeOperation[]>;
  readonly hasConflicts$: Observable<boolean> = of(true);

  private readonly updatedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  private readonly updated$: Observable<void> = this.updatedSubject.asObservable();

  constructor(private readonly documentationService: DocumentationService,
              private readonly router: Router) {
    const file: ClassDocumentation[] = this.router.getCurrentNavigation()!.extras.state as ClassDocumentation[];

    this.operations$ = this.documentationService.merge(file).pipe(shareReplay());
    this.hasConflicts$ = combineLatest([
      this.operations$,
      this.updated$
    ]).pipe(
      map(([operations, ]) => operations.some(this.hasClassConflict.bind(this)))
    );
    this.updatedSubject.next();
    this.operations$.subscribe(console.log);
  }

  merge(): void {

  }

  onUpdated(): void {
    this.updatedSubject.next();
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

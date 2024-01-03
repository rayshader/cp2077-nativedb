import {Component} from '@angular/core';
import {MatDividerModule} from "@angular/material/divider";
import {
  ClassDocumentation,
  ClassMergeOperation,
  DocumentationService
} from "../../../shared/services/documentation.service";
import {Router} from "@angular/router";
import {Observable} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {
  NDBMergeDocumentationComponent
} from "../../components/ndb-merge-documentation/ndb-merge-documentation.component";

@Component({
  selector: 'import',
  standalone: true,
  imports: [
    AsyncPipe,
    CdkAccordionModule,
    MatDividerModule,
    NDBMergeDocumentationComponent
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.scss'
})
export class ImportComponent {

  readonly operations$: Observable<ClassMergeOperation[]>;

  constructor(private readonly documentationService: DocumentationService,
              private readonly router: Router) {
    const file: ClassDocumentation[] = this.router.getCurrentNavigation()!.extras.state as ClassDocumentation[];

    this.operations$ = this.documentationService.merge(file);
    this.operations$.subscribe(console.log);
  }

}

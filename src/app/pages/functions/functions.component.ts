import {Component} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {Observable} from "rxjs";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";
import {AsyncPipe} from "@angular/common";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {MatIconModule} from "@angular/material/icon";

@Component({
  selector: 'functions',
  standalone: true,
  imports: [
    AsyncPipe,
    FunctionSpanComponent,
    MatIconModule
  ],
  templateUrl: './functions.component.html',
  styleUrl: './functions.component.scss'
})
export class FunctionsComponent {

  readonly functions$: Observable<RedFunctionAst[]>;

  constructor(dumpService: RedDumpService) {
    this.functions$ = dumpService.functions$;
  }

}

import {Component, Input} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {EMPTY, Observable} from "rxjs";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";
import {AsyncPipe} from "@angular/common";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";

@Component({
  selector: 'function',
  standalone: true,
  imports: [
    AsyncPipe,
    MatIconModule,
    FunctionSpanComponent,
  ],
  templateUrl: './function.component.html',
  styleUrl: './function.component.scss'
})
export class FunctionComponent {

  function$: Observable<RedFunctionAst | undefined> = EMPTY;

  constructor(private readonly dumpService: RedDumpService) {
  }

  @Input()
  set id(id: string) {
    this.function$ = this.dumpService.getFunctionById(+id);
  }

}

import {Component, Input} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {EMPTY, Observable} from "rxjs";
import {RedEnumAst} from "../../../shared/red-ast/red-enum.ast";
import {AsyncPipe} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'enum',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    AsyncPipe
  ],
  templateUrl: './enum.component.html',
  styleUrl: './enum.component.scss'
})
export class EnumComponent {

  enum$: Observable<RedEnumAst | undefined> = EMPTY;

  constructor(private readonly dumpService: RedDumpService) {
  }

  @Input()
  set id(id: string) {
    this.enum$ = this.dumpService.getEnumById(+id);
  }

  protected async copyClipboard(node: RedEnumAst, key: string): Promise<void> {
    let data: string = `${node.name}.${key}`;

    await navigator.clipboard.writeText(data);
  }

}

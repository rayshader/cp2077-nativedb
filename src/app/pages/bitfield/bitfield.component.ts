import {Component, Input} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {EMPTY, Observable} from "rxjs";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RedBitfieldAst} from "../../../shared/red-ast/red-bitfield.ast";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'bitfield',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    AsyncPipe
  ],
  templateUrl: './bitfield.component.html',
  styleUrl: './bitfield.component.scss'
})
export class BitfieldComponent {

  bitfield$: Observable<RedBitfieldAst | undefined> = EMPTY;

  constructor(private readonly dumpService: RedDumpService) {
  }

  @Input()
  set id(id: string) {
    this.bitfield$ = this.dumpService.getBitfieldById(+id);
  }

  protected async copyClipboard(node: RedBitfieldAst, key: string): Promise<void> {
    let data: string = `${node.name}.${key}`;

    await navigator.clipboard.writeText(data);
  }

}

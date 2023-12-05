import {Component, Input} from '@angular/core';
import {RouterService} from "../../../../shared/services/router.service";
import {RedTypeAst} from "../../../../shared/red-ast/red-type.ast";

@Component({
  selector: 'type-span',
  standalone: true,
  imports: [],
  templateUrl: './type-span.component.html',
  styleUrl: './type-span.component.scss'
})
export class TypeSpanComponent {

  @Input()
  node?: RedTypeAst;

  constructor(private readonly routerService: RouterService) {
  }

  get isPrimitive(): boolean {
    if (!this.node) {
      return false;
    }
    return RedTypeAst.isPrimitive(this.node);
  }

  onRedirect(): void {
    this.routerService.navigateTo(this.node!.id);
  }

}

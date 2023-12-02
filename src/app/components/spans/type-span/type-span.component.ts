import {Component, Input} from '@angular/core';
import {RedTypeAst} from "../../../../shared/red-ast/red-type.ast";
import {RouterService} from "../../../../shared/services/router.service";

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

  onRedirect(): void {
    this.routerService.navigateTo(this.node!.id);
  }

}

import {Injectable} from "@angular/core";
import {RedDumpService} from "./red-dump.service";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {Router, UrlTree} from "@angular/router";
import {firstValueFrom} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class RouterService {

  constructor(private readonly dumpService: RedDumpService,
              private readonly router: Router) {
  }

  async navigateTo(id: number, inTab: boolean = false): Promise<void> {
    const node: RedNodeAst | undefined = await firstValueFrom(this.dumpService.getById(id));

    if (node === undefined) {
      console.error(`Could not find route for node ${id}`);
      return;
    }
    const root: string = RedNodeKind[node.kind][0];

    if (inTab) {
      const urlTree: UrlTree = this.router.createUrlTree([root, id]);
      const url: string = this.router.serializeUrl(urlTree);

      window.open(url, '_blank');
    } else {
      await this.router.navigate([root, id]);
    }
  }

}

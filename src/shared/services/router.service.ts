import {Injectable} from "@angular/core";
import {RedDumpService} from "./red-dump.service";
import {RedNodeKind} from "../red-ast/red-node.ast";
import {Router} from "@angular/router";
import {firstValueFrom} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class RouterService {

  constructor(private readonly dumpService: RedDumpService,
              private readonly router: Router) {
  }

  async navigateTo(id: number): Promise<void> {
    const kind: RedNodeKind | undefined = await firstValueFrom(this.dumpService.getTypeById(id));

    if (!kind) {
      console.error(`Could not find route for node ${id}`);
      return;
    }
    const root: string = RedNodeKind[kind][0];

    await this.router.navigate([root, id]);
  }

}

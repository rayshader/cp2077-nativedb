import {RedDumpService} from "../../shared/services/red-dump.service";
import {inject} from "@angular/core";
import {ActivatedRouteSnapshot, Router, UrlTree} from "@angular/router";
import {cyrb53} from "../../shared/string";
import {RedNodeAst, RedNodeKind} from "../../shared/red-ast/red-node.ast";
import {combineLatestWith, filter, map} from "rxjs";

export function vanillaRedirectGuard(next: ActivatedRouteSnapshot) {
  const dumpService: RedDumpService = inject(RedDumpService);
  const router: Router = inject(Router);
  const name: string = next.paramMap.get('name') ?? '';

  if (name.length === 0) {
    return router.createUrlTree([]);
  }
  const nameOnly: boolean = (next.queryParamMap.get('name') ?? '') === 'only';
  const id: number = cyrb53(name);
  let fragment: string | undefined = next.fragment ?? undefined;

  if (fragment && !fragment.match(/[0-9]+/g)) {
    fragment = `${cyrb53(fragment)}`;
  }
  return dumpService.isReady$.pipe(
    filter((isReady) => isReady),
    combineLatestWith(dumpService.getById(id, nameOnly)),
    map(([, node]: [boolean, RedNodeAst | undefined]) => {
      if (!node) {
        return router.createUrlTree([]);
      }
      const url: UrlTree = router.createUrlTree(
        [RedNodeKind[node.kind][0], node.id],
        {fragment: fragment}
      );

      return router.navigateByUrl(url);
    })
  );
}

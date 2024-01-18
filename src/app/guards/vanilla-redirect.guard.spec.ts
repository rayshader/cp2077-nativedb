import {TestBed} from "@angular/core/testing";
import {provideRouter, Router} from "@angular/router";
import {RouterTestingHarness} from "@angular/router/testing";
import {RedDumpService} from "../../shared/services/red-dump.service";
import {RedDumpServiceMock} from "../../../tests/services/red-dump.service.mock";
import {vanillaRedirectGuard} from "./vanilla-redirect.guard";
import {Observable, of} from "rxjs";
import {RedNodeAst} from "../../shared/red-ast/red-node.ast";
import {AstHelper} from "../../../tests/ast.helper";
import {cyrb53} from "../../shared/string";
import {DummyComponent} from "../../../tests/angular/dummy.component";

describe('vanillaRedirectGuard', () => {
  let dumpMock: any;

  let router: Router;

  beforeEach(() => {
    dumpMock = RedDumpServiceMock;
    TestBed.configureTestingModule({
      providers: [
        {provide: RedDumpService, useValue: dumpMock},
        provideRouter([
          {path: '', component: DummyComponent},
          {path: ':name', canActivate: [vanillaRedirectGuard], component: DummyComponent},
          {path: 'c/:id', component: DummyComponent}
        ])
      ]
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    dumpMock.mockResetAll();
  })

  it('given route /Test when node is not found then redirect to route /', async () => {
    // GIVEN
    const observer: Observable<RedNodeAst | undefined> = of(undefined);

    dumpMock.getById.mockReturnValue(observer);

    // WHEN
    const harness: RouterTestingHarness = await RouterTestingHarness.create();

    await harness.navigateByUrl('Test');
    harness.detectChanges();

    // THEN
    expect(router.url).toBe('/');
  });

  it('given route /Test when node is found then redirect to route /c/:id', async () => {
    // GIVEN
    const observer: Observable<RedNodeAst | undefined> = of(AstHelper.buildClass('Test'));

    dumpMock.getById.mockReturnValue(observer);

    // WHEN
    const harness: RouterTestingHarness = await RouterTestingHarness.create();

    await harness.navigateByUrl('Test');
    harness.detectChanges();

    // THEN
    expect(router.url).toEqual(`/c/${cyrb53('Test')}`);
  });

  it('given route /Test?name=only then get node by id and name only', async () => {
    // GIVEN
    const observer: Observable<RedNodeAst | undefined> = of(AstHelper.buildClass('Test'));

    dumpMock.getById.mockReturnValue(observer);

    // WHEN
    const harness: RouterTestingHarness = await RouterTestingHarness.create();

    await harness.navigateByUrl('Test?name=only');
    harness.detectChanges();

    // THEN
    const id: number = cyrb53('Test');

    expect(dumpMock.getById).toHaveBeenCalledWith(id, true);
  });

  it('given route /Test#42 when node is found then redirect to route /c/:id#42', async () => {
    // GIVEN
    const observer: Observable<RedNodeAst | undefined> = of(AstHelper.buildClass('Test'));

    dumpMock.getById.mockReturnValue(observer);

    // WHEN
    const harness: RouterTestingHarness = await RouterTestingHarness.create();

    await harness.navigateByUrl('Test#42');
    harness.detectChanges();

    // THEN
    const id: number = cyrb53('Test');

    expect(router.url).toEqual(`/c/${id}#42`);
  });

});

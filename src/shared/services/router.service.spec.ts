import {RouterService} from "./router.service";
import {RedDumpServiceMock} from "../../../tests/services/red-dump.service.mock";
import {RouterMock} from "../../../tests/angular/router.mock";
import {Observable, of} from "rxjs";
import {RedNodeAst} from "../red-ast/red-node.ast";
import {AstHelper} from "../../../tests/ast.helper";
import {cyrb53} from "../string";

describe('RouterService', () => {
  let dumpMock: any;
  let routerMock: any;

  let service: RouterService;

  beforeAll(() => {
    dumpMock = RedDumpServiceMock;
    routerMock = RouterMock;

    service = new RouterService(dumpMock, routerMock);
  });

  afterEach(() => {
    dumpMock.mockResetAll();
    routerMock.mockResetAll();
  });

  describe('navigateTo(id)', () => {
    it('given unknown id then don\'t change current route', async () => {
      // GIVEN
      const observer: Observable<RedNodeAst | undefined> = of(undefined);

      dumpMock.getById.mockReturnValue(observer);

      // WHEN
      await service.navigateTo(0);

      // THEN
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('given id of an enum then navigate to /e/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      const observer: Observable<RedNodeAst | undefined> = of(AstHelper.buildEnum('Test'));

      dumpMock.getById.mockReturnValue(observer);

      // WHEN
      await service.navigateTo(id);

      // THEN
      expect(routerMock.navigate).toHaveBeenCalledWith(['e', id]);
    });

    it('given id of a bitfield then navigate to /b/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      const observer: Observable<RedNodeAst | undefined> = of(AstHelper.buildBitfield('Test'));

      dumpMock.getById.mockReturnValue(observer);

      // WHEN
      await service.navigateTo(id);

      // THEN
      expect(routerMock.navigate).toHaveBeenCalledWith(['b', id]);
    });

    it('given id of a class then navigate to /c/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      const observer: Observable<RedNodeAst | undefined> = of(AstHelper.buildClass('Test'));

      dumpMock.getById.mockReturnValue(observer);

      // WHEN
      await service.navigateTo(id);

      // THEN
      expect(routerMock.navigate).toHaveBeenCalledWith(['c', id]);
    });

    it('given id of a struct then navigate to /s/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      const observer: Observable<RedNodeAst | undefined> = of(AstHelper.buildStruct('Test'));

      dumpMock.getById.mockReturnValue(observer);

      // WHEN
      await service.navigateTo(id);

      // THEN
      expect(routerMock.navigate).toHaveBeenCalledWith(['s', id]);
    });
  });
});
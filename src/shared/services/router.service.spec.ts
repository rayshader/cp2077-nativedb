import {RouterService} from "./router.service";
import {RedDumpServiceMock} from "../../../tests/services/red-dump.service.mock";
import {RouterMock} from "../../../tests/angular/router.mock";
import {AstHelper} from "../../../tests/ast.helper";
import {cyrb53} from "../string";
import {mockWindowOpen} from "../../../tests/window.mock";
import {SearchServiceMock} from "../../../tests/services/search.service.mock";
import {FilterBy, SearchService} from "./search.service";
import {Router} from "@angular/router";
import {RedDumpService} from "./red-dump.service";
import {Injector} from "@angular/core";

jest.mock("../../shared/services/red-dump.service");

describe('RouterService', () => {
  let dumpMock: any;
  let searchMock: any;
  let routerMock: any;

  let service: RouterService;

  beforeAll(() => {
    dumpMock = RedDumpServiceMock;
    searchMock = SearchServiceMock;
    routerMock = RouterMock;

    const injector = Injector.create({
      providers: [
        { provide: RedDumpService, useValue: dumpMock },
        { provide: SearchService, useValue: searchMock },
        { provide: Router, useValue: routerMock },
        { provide: RouterService, useClass: RouterService, deps: [RedDumpService, SearchService, Router] },
      ]
    });

    service = injector.get(RouterService);
  });

  afterEach(() => {
    dumpMock.mockResetAll();
    searchMock.mockResetAll();
    routerMock.mockResetAll();
  });

  describe('navigateTo(id)', () => {
    it('given unknown id then don\'t change current route', async () => {
      // GIVEN
      dumpMock.getById.mockReturnValue(undefined);

      // WHEN
      await service.navigateTo(0);

      // THEN
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('given id of an enum then navigate to /e/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      dumpMock.getById.mockReturnValue(AstHelper.buildEnum('Test'));

      // WHEN
      await service.navigateTo(id);

      // THEN
      expect(routerMock.navigate).toHaveBeenCalledWith(['e', id]);
    });

    it('given id of a bitfield then navigate to /b/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      dumpMock.getById.mockReturnValue(AstHelper.buildBitfield('Test'));

      // WHEN
      await service.navigateTo(id);

      // THEN
      expect(routerMock.navigate).toHaveBeenCalledWith(['b', id]);
    });

    it('given id of a class then navigate to /c/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      dumpMock.getById.mockReturnValue(AstHelper.buildClass('Test'));

      // WHEN
      await service.navigateTo(id);

      // THEN
      expect(routerMock.navigate).toHaveBeenCalledWith(['c', id]);
    });

    it('given id of a struct then navigate to /s/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      dumpMock.getById.mockReturnValue(AstHelper.buildStruct('Test'));

      // WHEN
      await service.navigateTo(id);

      // THEN
      expect(routerMock.navigate).toHaveBeenCalledWith(['s', id]);
    });
  });

  describe('navigateTo(id, inTab: true)', () => {
    let openMock: any;

    beforeAll(() => {
      openMock = mockWindowOpen();
    });

    it('given unknown id then don\'t change current route', async () => {
      // GIVEN
      dumpMock.getById.mockReturnValue(undefined);

      // WHEN
      await service.navigateTo(0, true);

      // THEN
      expect(openMock).not.toHaveBeenCalled();
    });

    it('given id of an enum then navigate to /e/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      dumpMock.getById.mockReturnValue(AstHelper.buildEnum('Test'));
      routerMock.serializeUrl.mockReturnValue(`/e/${id}`);

      // WHEN
      await service.navigateTo(id, true);

      // THEN
      expect(openMock).toHaveBeenCalledWith(`/e/${id}`, '_blank');
    });

    it('given id of a bitfield then navigate to /b/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      dumpMock.getById.mockReturnValue(AstHelper.buildBitfield('Test'));
      routerMock.serializeUrl.mockReturnValue(`/b/${id}`);

      // WHEN
      await service.navigateTo(id, true);

      // THEN
      expect(openMock).toHaveBeenCalledWith(`/b/${id}`, '_blank');
    });

    it('given id of a class then navigate to /c/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      dumpMock.getById.mockReturnValue(AstHelper.buildClass('Test'));
      routerMock.serializeUrl.mockReturnValue(`/c/${id}`);

      // WHEN
      await service.navigateTo(id, true);

      // THEN
      expect(openMock).toHaveBeenCalledWith(`/c/${id}`, '_blank');
    });

    it('given id of a struct then navigate to /s/:id', async () => {
      // GIVEN
      const id: number = cyrb53('Test');
      dumpMock.getById.mockReturnValue(AstHelper.buildStruct('Test'));
      routerMock.serializeUrl.mockReturnValue(`/s/${id}`);

      // WHEN
      await service.navigateTo(id, true);

      // THEN
      expect(openMock).toHaveBeenCalledWith(`/s/${id}`, '_blank');
    });
  });

  describe('navigateByUsage(name)', () => {
    it('given a name then request search by name and filter by usage', async () => {
      // WHEN
      await service.navigateByUsage('GameInstance');

      // THEN
      expect(searchMock.requestSearch).toHaveBeenCalledWith('GameInstance', FilterBy.usage, true);
    });
  });
});

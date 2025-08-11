import "../../../tests/window.mock";
import {ResponsiveService} from "./responsive.service";
import {MatchMediaMock, mockMatchMedia} from "../../../tests/window.mock";
import {Injector} from "@angular/core";
import spyOn = jest.spyOn;

describe('ResponsiveService', () => {
  let service: ResponsiveService;
  let clientWidth: any;

  const createService = (): ResponsiveService => {
    const injector = Injector.create({
      providers: [
        { provide: ResponsiveService, useClass: ResponsiveService, deps: [] },
      ]
    });
    return injector.get(ResponsiveService);
  };

  beforeAll(() => {
    clientWidth = spyOn(document.body, 'clientWidth', 'get');
  });

  afterEach(() => {
    clientWidth.mockReset();
  });

  it('given body\'s width < 1025 then isMobile emit true', async () => {
    // GIVEN
    mockMatchMedia();
    clientWidth.mockReturnValue(1024);
    service = createService();

    // WHEN
    const isMobile: boolean = service.isMobile();

    // THEN
    expect(isMobile).toBeTruthy();
  });

  it('given body\'s width >= 1025 then isMobile emit false', async () => {
    // GIVEN
    mockMatchMedia();
    clientWidth.mockReturnValue(1025);
    service = createService();

    // WHEN
    const isMobile: boolean = service.isMobile();

    // THEN
    expect(isMobile).toBeFalsy();
  });

  it('given body\'s width is 1280 when width changes to 768 then isMobile emit true', async () => {
    // GIVEN
    const matchMediaMock: MatchMediaMock = mockMatchMedia();

    clientWidth.mockReturnValue(1280);
    service = createService();
    let isMobile: boolean = service.isMobile();

    expect(isMobile).toBeFalsy();

    // WHEN
    clientWidth.mockReturnValue(768);
    matchMediaMock.dispatch();
    isMobile = service.isMobile();

    // THEN
    expect(isMobile).toBeTruthy();
  });

  it('given body\'s width is 768 when width changes to 1280 then isMobile emit false', async () => {
    // GIVEN
    const matchMediaMock: MatchMediaMock = mockMatchMedia();

    clientWidth.mockReturnValue(768);
    service = createService();
    let isMobile: boolean = service.isMobile();

    expect(isMobile).toBeTruthy();

    // WHEN
    clientWidth.mockReturnValue(1280);
    matchMediaMock.dispatch();
    isMobile = service.isMobile();

    // THEN
    expect(isMobile).toBeFalsy();
  });

});

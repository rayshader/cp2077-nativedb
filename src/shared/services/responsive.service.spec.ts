import "../../../tests/window.mock";
import {ResponsiveService} from "./responsive.service";
import {firstValueFrom} from "rxjs";
import {MatchMediaMock, mockMatchMedia} from "../../../tests/window.mock";
import spyOn = jest.spyOn;

describe('ResponsiveService', () => {
  let service: ResponsiveService;
  let clientWidth: any;

  beforeAll(() => {
    clientWidth = spyOn(document.body, 'clientWidth', 'get');
  });

  afterEach(() => {
    clientWidth.mockReset();
  });

  it('given body\'s width < 1025 then mobile$ emit true', async () => {
    // GIVEN
    mockMatchMedia();
    clientWidth.mockReturnValue(1024);
    service = new ResponsiveService();

    // WHEN
    const isMobile: boolean = await firstValueFrom(service.mobile$);

    // THEN
    expect(isMobile).toBeTruthy();
  });

  it('given body\'s width >= 1025 then mobile$ emit false', async () => {
    // GIVEN
    mockMatchMedia();
    clientWidth.mockReturnValue(1025);
    service = new ResponsiveService();

    // WHEN
    const isMobile: boolean = await firstValueFrom(service.mobile$);

    // THEN
    expect(isMobile).toBeFalsy();
  });

  it('given body\'s width is 1280 when width changes to 768 then mobile$ emit true', async () => {
    // GIVEN
    const matchMediaMock: MatchMediaMock = mockMatchMedia();

    clientWidth.mockReturnValue(1280);
    service = new ResponsiveService();
    let isMobile: boolean = await firstValueFrom(service.mobile$);

    expect(isMobile).toBeFalsy();

    // WHEN
    clientWidth.mockReturnValue(768);
    matchMediaMock.dispatch();
    isMobile = await firstValueFrom(service.mobile$);

    // THEN
    expect(isMobile).toBeTruthy();
  });

  it('given body\'s width is 768 when width changes to 1280 then mobile$ emit false', async () => {
    // GIVEN
    const matchMediaMock: MatchMediaMock = mockMatchMedia();

    clientWidth.mockReturnValue(768);
    service = new ResponsiveService();
    let isMobile: boolean = await firstValueFrom(service.mobile$);

    expect(isMobile).toBeTruthy();

    // WHEN
    clientWidth.mockReturnValue(1280);
    matchMediaMock.dispatch();
    isMobile = await firstValueFrom(service.mobile$);

    // THEN
    expect(isMobile).toBeFalsy();
  });

});

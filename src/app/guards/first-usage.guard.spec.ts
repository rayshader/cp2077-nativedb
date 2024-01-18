import {TestBed} from "@angular/core/testing";
import {provideRouter, Router} from "@angular/router";
import {SettingsService} from "../../shared/services/settings.service";
import {firstUsageGuard} from "./first-usage.guard";
import {SettingsServiceMock} from "../../../tests/services/settings.service.mock";
import {RouterTestingHarness} from "@angular/router/testing";
import {DummyComponent} from "../../../tests/angular/dummy.component";

describe('firstUsageGuard', () => {
  let settingsMock: any;
  let router: Router;

  beforeEach(() => {
    settingsMock = SettingsServiceMock;
    TestBed.configureTestingModule({
      providers: [
        {provide: SettingsService, useValue: settingsMock},
        provideRouter([
          {path: 'test', canActivate: [firstUsageGuard], component: DummyComponent},
          {path: 'readme', component: DummyComponent}
        ])
      ]
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    settingsMock.mockResetAll();
  })

  it('should redirect to route /readme on first usage and never after', async () => {
    // GIVEN
    settingsMock.mockIsFirstUsage(true);

    // WHEN
    const harness: RouterTestingHarness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/test');
    harness.detectChanges();

    // THEN
    expect(settingsMock.toggleFirstUsage).toHaveBeenCalled();
    expect(router.url).toEqual('/readme');
  });

  it('should allow next route when it is not the first usage', async () => {
    // GIVEN
    settingsMock.mockIsFirstUsage(false);

    // WHEN
    const harness: RouterTestingHarness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/test');
    harness.detectChanges();

    // THEN
    expect(settingsMock.toggleFirstUsage).not.toHaveBeenCalled();
    expect(router.url).toEqual('/test');
  });

});

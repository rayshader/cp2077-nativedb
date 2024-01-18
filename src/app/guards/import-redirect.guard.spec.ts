import {TestBed} from "@angular/core/testing";
import {provideRouter, Router} from "@angular/router";
import {RouterTestingHarness} from "@angular/router/testing";
import {DummyComponent} from "../../../tests/angular/dummy.component";
import {importRedirectGuard} from "./import-redirect.guard";

describe('importRedirectGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {path: '', component: DummyComponent},
          {path: 'import', canActivate: [importRedirectGuard], component: DummyComponent}
        ])
      ]
    });
    router = TestBed.inject(Router);
  });

  it('should redirect to route / when there is no current navigation', async () => {
    // WHEN
    const harness: RouterTestingHarness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/import');
    harness.detectChanges();

    // THEN
    expect(router.url).toBe('/');
  });

  it('should redirect to route / when navigation data is not an Array', async () => {
    // WHEN
    const harness: RouterTestingHarness = await RouterTestingHarness.create();

    await router.navigate(['import'], {state: {}});
    harness.detectChanges();

    // THEN
    expect(router.url).toBe('/');
  });

  it('should allow route /import when navigation data is an Array', async () => {
    // WHEN
    const harness: RouterTestingHarness = await RouterTestingHarness.create();

    await router.navigate(['import'], {state: []});
    harness.detectChanges();

    // THEN
    expect(router.url).toBe('/import');
  });

});

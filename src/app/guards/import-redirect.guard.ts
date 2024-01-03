import {inject} from "@angular/core";
import {Navigation, Router} from "@angular/router";

export function importRedirectGuard() {
  const router: Router = inject(Router);
  const navigation: Navigation | null = router.getCurrentNavigation();

  if (navigation === null) {
    return router.navigateByUrl('');
  }
  const state: any = navigation.extras.state;

  if (!(state instanceof Array)) {
    return router.navigateByUrl('');
  }
  return true;
}

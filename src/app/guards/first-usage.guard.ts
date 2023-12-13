import {inject} from "@angular/core";
import {Router} from "@angular/router";
import {SettingsService} from "../../shared/services/settings.service";

export function firstUsageGuard() {
  const settingsService: SettingsService = inject(SettingsService);
  const router: Router = inject(Router);

  if (settingsService.isFirstUsage) {
    settingsService.toggleFirstUsage();
    return router.createUrlTree(['readme']);
  }
  return true;
}

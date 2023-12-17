import {ApplicationConfig, isDevMode} from '@angular/core';
import {PreloadAllModules, provideRouter, withComponentInputBinding, withPreloading} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient} from "@angular/common/http";
import {provideServiceWorker} from '@angular/service-worker';

import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules)
    ),
    provideAnimations(),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};

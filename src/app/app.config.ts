import {ApplicationConfig, isDevMode} from '@angular/core';
import {PreloadAllModules, provideRouter, withComponentInputBinding, withPreloading} from '@angular/router';
import {provideHttpClient} from "@angular/common/http";
import {provideServiceWorker} from '@angular/service-worker';
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import {MAT_SNACK_BAR_DEFAULT_OPTIONS} from "@angular/material/snack-bar";

import {routes} from './app.routes';
import {WikiDB} from "../shared/repositories/wiki.database";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules)
    ),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),

    {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 4000}},

    {provide: WikiDB, useValue: new WikiDB()},
  ]
};

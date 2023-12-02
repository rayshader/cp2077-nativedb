import {ApplicationConfig} from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';

import {routes} from './app.routes';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient} from "@angular/common/http";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(),
  ]
};

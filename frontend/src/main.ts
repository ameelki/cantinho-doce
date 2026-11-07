import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LOCALE_ID, NgZone } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth.interceptor';
import { I18n } from './app/core/i18n.service';
import { startDomTranslation } from './app/core/dom-translator';

registerLocaleData(localeFr, 'fr');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr' },
  ],
}).then((ref) => {
  // Hors zone Angular : la traduction du texte ne déclenche aucun cycle de détection de changements.
  ref.injector.get(NgZone).runOutsideAngular(() => startDomTranslation(ref.injector.get(I18n)));
}).catch((err) => console.error(err));

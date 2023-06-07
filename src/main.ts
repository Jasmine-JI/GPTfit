import { enableProdMode, APP_INITIALIZER, Injector, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { startupServiceFactory, createTranslateLoader } from './app/app.module';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PortalModule } from './app/containers/portal/portal.module';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { CustomMatPaginatorIntl } from './app/core/classes/custom-mat-paginator-intl';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TokenInterceptor, HttpStatusInterceptor } from './app/core/interceptors';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  withInterceptorsFromDi,
  provideHttpClient,
} from '@angular/common/http';
import { AuthGuard, SigninGuard } from './app/core/guard';
import { WINDOW_PROVIDERS, StartupService } from './app/core/services';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      AppRoutingModule,
      CommonModule,
      PortalModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),
    WINDOW_PROVIDERS,
    StartupService,
    AuthGuard,
    SigninGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpStatusInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: startupServiceFactory,
      deps: [StartupService, Injector],
      multi: true,
    },
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginatorIntl,
    },
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
  ],
}).catch((err) => console.error(err));

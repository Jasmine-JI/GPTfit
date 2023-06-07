import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, Injector } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PortalModule } from './containers/portal/portal.module';
import { WINDOW_PROVIDERS, StartupService } from './core/services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthGuard, SigninGuard } from './core/guard';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpStatusInterceptor, TokenInterceptor } from './core/interceptors';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from './core/classes/custom-mat-paginator-intl';
// import { ServiceWorkerModule } from '@angular/service-worker';
import { CommonModule } from '@angular/common';

export function startupServiceFactory(startupService: StartupService) {
  return () => startupService.load();
}
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json?v=' + Date.now());
}

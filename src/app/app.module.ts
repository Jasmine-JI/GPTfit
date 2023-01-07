import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, Injector } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PortalModule } from './containers/portal/portal.module';
import { SharedComponentsModule } from './shared/components/shared-components.module';
import { WINDOW_PROVIDERS, StartupService } from './core/services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthGuard, SigninGuard } from './core/guard';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpStatusInterceptor, TokenInterceptor } from './core/interceptors';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgProgressModule } from '@ngx-progressbar/core';
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
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PortalModule,
    SharedComponentsModule,
    BrowserAnimationsModule,
    CommonModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    NgProgressModule,
    HttpClientModule,
    // ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
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
      provide: APP_INITIALIZER, // 在頁面載入前就先從localstorage取token狀態判斷是否登入
      useFactory: startupServiceFactory,
      deps: [StartupService, Injector],
      multi: true,
    },
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginatorIntl,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

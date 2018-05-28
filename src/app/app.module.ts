import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, Injector } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { PortalModule } from './containers/portal/portal.module';
import { DashboardModule } from './containers/dashboard/dashboard.module';
import { SharedComponentsModule } from './shared/components/shared-components.module';
import { WINDOW_PROVIDERS } from '@shared/services/window.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StartupService } from '@shared/services/startup.service';
import { AuthGuard } from '@shared/auth.guard';
export function startupServiceFactory(startupService: StartupService): Function { return () => startupService.load(); }

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PortalModule,
    DashboardModule,
    SharedComponentsModule,
    BrowserAnimationsModule
  ],
  providers: [
    WINDOW_PROVIDERS,
    StartupService,
    AuthGuard,
    {
      provide: APP_INITIALIZER,
      useFactory: startupServiceFactory,
      deps: [StartupService, Injector],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

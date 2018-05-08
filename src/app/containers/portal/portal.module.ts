import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { PortalRoutingModule } from './portal-routing.module';
import { PortalComponent } from './portal.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { SharedPipes } from '@shared/pipes/shared-pipes';
import { MapInfoComponent } from './components/map-info/map-info.component';
import { MapGPXService } from '@shared/services/map-gpx.service';
import { RankFormService } from './services/rank-form.service';
import { MapService } from '@shared/services/map.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { PasswordComponent } from './components/password/password.component';
import { ResetPasswordService } from './services/reset-password.service';
import { EmptyResponseBodyErrorInterceptor } from './services/empty-response-body-error-interceptor';
import { BrowserXhr } from '@angular/http';
import { PatternValidator } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { SharedComponentsModule } from '@shared/components/shared-components.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { DemoQrcodComponent } from './components/demo-qrcod/demo-qrcod.component';

@NgModule({
  imports: [
    CommonModule,
    PortalRoutingModule,
    HttpClientModule,
    FormsModule,
    MyDatePickerModule,
    SharedComponentsModule,
    SharedPipes
  ],
  providers: [
    MapGPXService,
    RankFormService,
    MapService,
    GlobalEventsManager,
    ResetPasswordService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EmptyResponseBodyErrorInterceptor,
      multi: true
    },
    PatternValidator
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    PortalComponent,
    LeaderboardComponent,
    MapInfoComponent,
    PasswordComponent,
    DemoQrcodComponent
  ]
})
export class PortalModule {}

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';

import { PortalRoutingModule } from './portal-routing.module';
import { PortalComponent } from './portal.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { SharedPipes } from '@shared/pipes/shared-pipes';
import { MapInfoComponent } from './components/map-info/map-info.component';
import { MapGPXService } from '@shared/services/map-gpx.service';
import { RankFormService } from './services/rank-form.service';
import { MapService } from '@shared/services/map.service';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { ResetPasswordService } from './services/reset-password.service';
import { EmptyResponseBodyErrorInterceptor } from './services/empty-response-body-error-interceptor';
import { PatternValidator } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { SharedComponentsModule } from '@shared/components/shared-components.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { DemoQrcodComponent } from './components/demo-qrcod/demo-qrcod.component';
import { QrcodeService } from './services/qrcode.service';
import { NgProgressModule } from '@ngx-progressbar/core';
import { AuthService } from '@shared/services/auth.service';
import { UtilsService } from '@shared/services/utils.service';
import { SharedModule } from '@shared/shared.module';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { RandomCodeService } from './services/random-code.service';
import { SignupService } from './services/signup.service';
import { ForgetService } from './services/forget.service';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { UserProfileService } from '@shared/services/user-profile.service';
import { PortalGroupInfoComponent } from './components/portal-group-info/portal-group-info.component';
import { CustomMaterialModule } from '@shared/custom-material.module.ts';
import { BasicInfoComponent } from './components/user-profile/basic-info/basic-info.component';
import { ActivityService } from '@shared/services/activity.service.ts';
import { ReportService } from '@shared/services/report.service';
import { ActivityOtherDetailsService } from '@shared/services/activity-other-details.service';
import { DetectInappService } from '@shared/services/detect-inapp.service';
import { ApplicationComponent } from './components/application/application.component';
import { AppSignupComponent } from './components/app-sign/app-signup/app-signup.component';
import { AppSigninComponent } from './components/app-sign/app-signin/app-signin.component';
import { AppEnableComponent } from './components/app-sign/app-enable/app-enable.component';
import { AppForgetpwComponent } from './components/app-sign/app-forgetpw/app-forgetpw.component';
import { AppModifypwComponent } from './components/app-sign/app-modifypw/app-modifypw.component';
import { AppChangeAccountComponent } from './components/app-sign/app-change-account/app-change-account.component';
import { AppQrcodeLoginComponent } from './components/app-sign/app-qrcode-login/app-qrcode-login.component';
import { AppFirstLoginComponent } from './components/app-sign/app-first-login/app-first-login.component';
import { QRCodeModule } from 'angularx-qrcode';
import { OfficialActivityComponent } from './components/official-activity/official-activity.component';
import { OfficialActivityService } from '../../shared/services/official-activity.service';

@NgModule({
  imports: [
    CommonModule,
    PortalRoutingModule,
    HttpClientModule,
    HttpClientJsonpModule,
    FormsModule,
    MyDatePickerModule,
    SharedComponentsModule,
    SharedPipes,
    NgProgressModule,
    ReactiveFormsModule,
    SharedModule,
    CustomMaterialModule,
    QRCodeModule
  ],
  providers: [
    MapGPXService,
    RankFormService,
    MapService,
    QrcodeService,
    AuthService,
    GlobalEventsManager,
    ResetPasswordService,
    UtilsService,
    RandomCodeService,
    SignupService,
    ForgetService,
    UserProfileService,
    ActivityService,
    ReportService,
    ActivityOtherDetailsService,
    DetectInappService,
    OfficialActivityService,
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
    DemoQrcodComponent,
    UserProfileComponent,
    PortalGroupInfoComponent,
    BasicInfoComponent,
    ApplicationComponent,
    AppSignupComponent,
    AppSigninComponent,
    AppEnableComponent,
    AppChangeAccountComponent,
    AppForgetpwComponent,
    AppModifypwComponent,
    AppQrcodeLoginComponent,
    AppFirstLoginComponent,
    OfficialActivityComponent
  ],
  entryComponents: [MessageBoxComponent]
})
export class PortalModule {}

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientJsonpModule } from '@angular/common/http';
import { PortalRoutingModule } from './portal-routing.module';
import { PortalComponent } from './portal.component';
import { SharedPipes } from '../../shared/pipes/shared-pipes';
import { EmptyResponseBodyErrorInterceptor } from '../../core/interceptors/empty-response-body-error-interceptor';
import { PatternValidator } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { QrcodeService } from './services/qrcode.service';
import { NgProgressModule } from '@ngx-progressbar/core';
import { SharedModule } from '../../shared/shared.module';
import { CustomMaterialModule } from '../../core/custom-material.module';
import { AppSignupComponent } from './components/app-sign/app-signup/app-signup.component';
import { AppSigninComponent } from './components/app-sign/app-signin/app-signin.component';
import { AppEnableComponent } from './components/app-sign/app-enable/app-enable.component';
import { AppForgetpwComponent } from './components/app-sign/app-forgetpw/app-forgetpw.component';
import { AppModifypwComponent } from './components/app-sign/app-modifypw/app-modifypw.component';
import { AppChangeAccountComponent } from './components/app-sign/app-change-account/app-change-account.component';
import { AppQrcodeLoginComponent } from './components/app-sign/app-qrcode-login/app-qrcode-login.component';
import { AppFirstLoginComponent } from './components/app-sign/app-first-login/app-first-login.component';
import { QRCodeModule } from 'angularx-qrcode';
import { AppCompressDataComponent } from './components/app-sign/app-compress-data/app-compress-data.component';
import { AppDestroyAccountComponent } from './components/app-sign/app-destroy-account/app-destroy-account.component';
import { HashIdService, DetectInappService } from '../../core/services';
import { SportPaceSibsModule, SportPaceSibsPipe } from '../../core/pipes';

@NgModule({
  imports: [
    CommonModule,
    PortalRoutingModule,
    HttpClientJsonpModule,
    FormsModule,
    MyDatePickerModule,
    SharedComponentsModule,
    SharedPipes,
    NgProgressModule,
    ReactiveFormsModule,
    SharedModule,
    CustomMaterialModule,
    QRCodeModule,
    SportPaceSibsModule,
  ],
  providers: [
    QrcodeService,
    HashIdService,
    DetectInappService,
    SportPaceSibsPipe,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EmptyResponseBodyErrorInterceptor,
      multi: true,
    },
    PatternValidator,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    PortalComponent,
    AppSignupComponent,
    AppSigninComponent,
    AppEnableComponent,
    AppChangeAccountComponent,
    AppForgetpwComponent,
    AppModifypwComponent,
    AppQrcodeLoginComponent,
    AppFirstLoginComponent,
    AppCompressDataComponent,
    AppDestroyAccountComponent,
  ],
})
export class PortalModule {}

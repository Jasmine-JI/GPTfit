import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientJsonpModule } from '@angular/common/http';
import { PortalRoutingModule } from './portal-routing.module';
import { PortalComponent } from './portal.component';
import { EmptyResponseBodyErrorInterceptor } from '../../core/interceptors/empty-response-body-error-interceptor';
import { PatternValidator } from '@angular/forms';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
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
import { HashIdService, DetectInappService, QrcodeService } from '../../core/services';
import {
  SportPaceSibsPipe,
  SportTypeIconPipe,
  ProductTypePipe,
  SexPipe,
  SafeHtmlPipe,
  LineBreakPipe,
  GroupStatusPipe,
  GroupLevelNamePipe,
  SportTimePipe,
  MuscleNamePipe,
  SlicePipe,
  RelativeDayPipe,
  TimeFormatPipe,
  RegionCodePipe,
  LanguageCodePipe,
  AppIdPipe,
  SystemIdPipe,
  SportTypePipe,
  LongTextPipe,
  GroupIdSlicePipe,
  ThousandConversionPipe,
  SpeedSibsPipe,
  TemperatureSibsPipe,
  SwimPosturePipe,
  DataTypeTranslatePipe,
  DataTypeUnitPipe,
  PaiPipe,
  FindPreferPipe,
  MuscleGroupIconPipe,
  PythagoreanPipe,
  MathAbsPipe,
  BodyHeightSibsPipe,
  BMIPipe,
  BodyAssessmentPipe,
  FFMIPipe,
  DataFlowConversionPipe,
  LengthSibsPipe,
  SafeStylePipe,
  PatchUnitPipe,
  AgePipe,
  RankSuffixPipe,
  TargetFieldNamePipe,
  TargetFieldUnitPipe,
  MuscleGroupNamePipe,
  MusclePartIconPipe,
} from '../../core/pipes';
import { LoadingBarComponent } from '../../components';

@NgModule({
  imports: [
    CommonModule,
    PortalRoutingModule,
    HttpClientJsonpModule,
    FormsModule,
    ProductTypePipe,
    ReactiveFormsModule,
    SharedModule,
    CustomMaterialModule,
    QRCodeModule,
    SportPaceSibsPipe,
    SportTypeIconPipe,
    SexPipe,
    SafeHtmlPipe,
    LineBreakPipe,
    GroupStatusPipe,
    GroupLevelNamePipe,
    SportTimePipe,
    MuscleNamePipe,
    SlicePipe,
    RelativeDayPipe,
    TimeFormatPipe,
    RegionCodePipe,
    LanguageCodePipe,
    AppIdPipe,
    SystemIdPipe,
    SportTypePipe,
    LongTextPipe,
    GroupIdSlicePipe,
    ThousandConversionPipe,
    SpeedSibsPipe,
    TemperatureSibsPipe,
    SwimPosturePipe,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    PaiPipe,
    FindPreferPipe,
    MuscleGroupIconPipe,
    PythagoreanPipe,
    MathAbsPipe,
    BodyHeightSibsPipe,
    BMIPipe,
    BodyAssessmentPipe,
    FFMIPipe,
    DataFlowConversionPipe,
    LengthSibsPipe,
    SafeStylePipe,
    PatchUnitPipe,
    AgePipe,
    RankSuffixPipe,
    TargetFieldNamePipe,
    TargetFieldUnitPipe,
    MuscleGroupNamePipe,
    MusclePartIconPipe,
    LoadingBarComponent,
    SharedComponentsModule,
  ],
  providers: [
    HashIdService,
    DetectInappService,
    QrcodeService,
    SportPaceSibsPipe,
    SportPaceSibsPipe,
    SexPipe,
    SafeHtmlPipe,
    LineBreakPipe,
    GroupStatusPipe,
    GroupLevelNamePipe,
    SportTimePipe,
    MuscleNamePipe,
    SlicePipe,
    RelativeDayPipe,
    TimeFormatPipe,
    RegionCodePipe,
    LanguageCodePipe,
    AppIdPipe,
    SystemIdPipe,
    SportTypePipe,
    LongTextPipe,
    GroupIdSlicePipe,
    ThousandConversionPipe,
    SpeedSibsPipe,
    TemperatureSibsPipe,
    SwimPosturePipe,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    PaiPipe,
    FindPreferPipe,
    MuscleGroupIconPipe,
    PythagoreanPipe,
    MathAbsPipe,
    BodyHeightSibsPipe,
    BMIPipe,
    BodyAssessmentPipe,
    FFMIPipe,
    DataFlowConversionPipe,
    LengthSibsPipe,
    SafeStylePipe,
    PatchUnitPipe,
    AgePipe,
    RankSuffixPipe,
    TargetFieldNamePipe,
    TargetFieldUnitPipe,
    MuscleGroupNamePipe,
    MusclePartIconPipe,
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

import { NgModule, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { Page404Component } from './page404/page404.component';
import { LoadingComponent } from './loading/loading.component';
import { PaginationComponent } from './pagination/pagination.component';
import { UploadFileComponent } from './upload-file/upload-file.component';
import { RouterModule } from '@angular/router';
import { IntlPhoneInputComponent } from './intl-phone-input/intl-phone-input.component';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared.module';
import { MessageBoxComponent } from './message-box/message-box.component';
import { CustomMaterialModule } from '../custom-material.module';
import { ConfirmButtonComponent } from './confirm-button/confirm-button.component';
import { FormTextComponent } from './form-text/form-text.component';
import { FormRemindComponent } from './form-remind/form-remind.component';
import { FormTextareaComponent } from './form-textarea/form-textarea.component';
import { MemberCapsuleComponent } from './member-capsule/member-capsule.component';
import { SharedPipes } from '@shared/pipes/shared-pipes';
import { Page403Component } from './page403/page403.component';
import { AlaIframeComponent } from './ala-iframe/ala-iframe.component';
import { MyActivityComponent } from './my-activity/my-activity.component';
import { ActivityInfoComponent } from './activity-info/activity-info.component';
import {
  SportReportComponent,
  ActivityLevelsComponent,
  AllDurationComponent,
  AllGroupsComponent,
  AllTimesComponent,
  BurnCaloriesComponent,
  ColumnstackedChartComponent,
  OtherBurnCaloriesComponent,
  PartialMuscleInfoComponent,
  ScatterChartComponent
} from './sport-report';
import { NgProgressModule } from '@ngx-progressbar/core';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    CustomMaterialModule,
    SharedPipes,
    NgProgressModule
  ],
  declarations: [
    NavbarComponent,
    Page404Component,
    LoadingComponent,
    PaginationComponent,
    UploadFileComponent,
    IntlPhoneInputComponent,
    MessageBoxComponent,
    ConfirmButtonComponent,
    FormTextComponent,
    FormRemindComponent,
    FormTextareaComponent,
    MemberCapsuleComponent,
    Page403Component,
    AlaIframeComponent,
    MyActivityComponent,
    ActivityInfoComponent,
    SportReportComponent,
    ActivityLevelsComponent,
    AllDurationComponent,
    AllGroupsComponent,
    AllTimesComponent,
    BurnCaloriesComponent,
    ColumnstackedChartComponent,
    OtherBurnCaloriesComponent,
    PartialMuscleInfoComponent,
    ScatterChartComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    NavbarComponent,
    Page404Component,
    LoadingComponent,
    PaginationComponent,
    UploadFileComponent,
    IntlPhoneInputComponent,
    MessageBoxComponent,
    ConfirmButtonComponent,
    FormTextComponent,
    FormRemindComponent,
    FormTextareaComponent,
    MemberCapsuleComponent,
    AlaIframeComponent,
    MyActivityComponent,
    ActivityInfoComponent,
    SportReportComponent,
    ActivityLevelsComponent,
    AllDurationComponent,
    AllGroupsComponent,
    AllTimesComponent,
    BurnCaloriesComponent,
    ColumnstackedChartComponent,
    OtherBurnCaloriesComponent,
    PartialMuscleInfoComponent,
    ScatterChartComponent
  ]
})
export class SharedComponentsModule {}

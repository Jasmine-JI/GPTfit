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
import { SportReportComponent } from './sport-report/sport-report.component';
import { NgProgressModule } from '@ngx-progressbar/core';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ShareGroupInfoDialogComponent } from './share-group-info-dialog/share-group-info-dialog.component';
import { QRCodeModule } from 'angularx-qrcode';
import { MuscleMapComponent } from './activity-info/muscleMap/muscle-map.component';
import { MuscleTrainListComponent } from './activity-info/muscle-train-list/muscle-train-list.component';
import { ReportContentComponent } from './sport-report/report-content/report-content.component';
import { RingChartComponent } from './chart/ring-chart/ring-chart.component';
import { HrzoneChartComponent } from './chart/hrzone-chart/hrzone-chart.component';
import { HrzoneInfoComponent } from './chart/hrzone-info/hrzone-info.component';
import { DistributionChartComponent } from './chart/distribution-chart/distribution-chart.component';
import { StackColumnChartComponent } from './chart/stack-column-chart/stack-column-chart.component';
import { FilletColumnChartComponent } from './chart/fillet-column-chart/fillet-column-chart.component';
import { CompareLineChartComponent } from './chart/compare-line-chart/compare-line-chart.component';
import { DiscolorColumnChartComponent } from './chart/discolor-column-chart/discolor-column-chart.component';
import { LineChartComponent } from './chart/line-chart/line-chart.component';
import { MyLifeTrackingComponent } from './my-life-tracking/my-life-tracking.component';
import { BodyConstituteSvgComponent } from './chart/body-constitute-svg/body-constitute-svg.component';
import { TuiCalenderComponent } from './tui-calender/tui-calender.component';
import { HoverHintComponent } from './hover-hint/hover-hint.component';
import { DateRangePickerComponent } from './date-range-picker/date-range-picker.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ImageCropperModule,
    ReactiveFormsModule,
    SharedModule,
    CustomMaterialModule,
    SharedPipes,
    NgProgressModule,
    QRCodeModule
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
    ShareGroupInfoDialogComponent,
    MuscleMapComponent,
    MuscleTrainListComponent,
    ReportContentComponent,
    RingChartComponent,
    HrzoneChartComponent,
    HrzoneInfoComponent,
    DistributionChartComponent,
    StackColumnChartComponent,
    FilletColumnChartComponent,
    CompareLineChartComponent,
    DiscolorColumnChartComponent,
    LineChartComponent,
    MyLifeTrackingComponent,
    BodyConstituteSvgComponent,
    TuiCalenderComponent,
    HoverHintComponent,
    DateRangePickerComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    NavbarComponent,
    Page404Component,
    Page403Component,
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
    ShareGroupInfoDialogComponent,
    RingChartComponent,
    HrzoneChartComponent,
    HrzoneInfoComponent,
    DistributionChartComponent,
    StackColumnChartComponent,
    FilletColumnChartComponent,
    CompareLineChartComponent,
    DiscolorColumnChartComponent,
    LineChartComponent,
    BodyConstituteSvgComponent,
    TuiCalenderComponent,
    HoverHintComponent,
    DateRangePickerComponent
  ]
})
export class SharedComponentsModule {}

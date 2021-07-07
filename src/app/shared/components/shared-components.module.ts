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
import { SharedPipes } from '../pipes/shared-pipes';
import { Page403Component } from './page403/page403.component';
import { AlaIframeComponent } from './ala-iframe/ala-iframe.component';
import { MyActivityComponent } from './my-activity/my-activity.component';
import { NgProgressModule } from '@ngx-progressbar/core';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ShareGroupInfoDialogComponent } from './share-group-info-dialog/share-group-info-dialog.component';
import { QRCodeModule } from 'angularx-qrcode';
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
import { HoverHintComponent } from './hover-hint/hover-hint.component';
import { DateRangePickerComponent } from './date-range-picker/date-range-picker.component';
import { MuscleMapChartComponent } from './chart/muscle-map/muscle-map-chart/muscle-map-chart.component';
import { MuscleSvgIconComponent } from './chart/muscle-map/muscle-svg-icon/muscle-svg-icon.component';
import { CustomSelectComponent } from './custom-material/custom-select/custom-select.component';
import { ReportFilterComponent } from './report-filter/report-filter.component';
import { BottomSheetComponent } from './bottom-sheet/bottom-sheet.component';
import { SportsReportComponent } from './sports-report/sports-report.component';
import { LoadingIconComponent } from './loading-icon/loading-icon.component';
import { ImgCropperComponent } from './image-cropper/image-cropper.component';
import { PrivacySettingDialogComponent } from './privacy-setting-dialog/privacy-setting-dialog.component';
import { ActivityDetailComponent } from './activity-detail/activity-detail.component';
import { MapChartCompareComponent } from './map-chart-compare/map-chart-compare.component';
import { TrinomialChartComponent } from './chart/trinomial-chart/trinomial-chart.component';
import { QuadrantChartComponent } from './chart/quadrant-chart/quadrant-chart.component';
import { ThresholdInfoComponent } from './chart/threshold-info/threshold-info.component';
import { ThresholdChartComponent } from './chart/threshold-chart/threshold-chart.component';
import { TrendInfoChartComponent } from './chart/trend-info-chart/trend-info-chart.component';
import { MuscleMapCardComponent } from './activity-detail/muscle-map-card/muscle-map-card.component';
import { LoadingBarComponent } from './loading-bar/loading-bar.component';
import { EditIndividualPrivacyComponent } from './edit-individual-privacy/edit-individual-privacy.component';
import { CloudrunMapComponent } from './cloudrun-map/cloudrun-map.component';
import { EquidistantChartComponent } from './chart/equidistant-chart/equidistant-chart.component';
import { RelativeColumnChartComponent } from './chart/relative-column-chart/relative-column-chart.component';

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
    MyLifeTrackingComponent,
    BodyConstituteSvgComponent,
    HoverHintComponent,
    DateRangePickerComponent,
    MuscleMapChartComponent,
    MuscleSvgIconComponent,
    CustomSelectComponent,
    ReportFilterComponent,
    BottomSheetComponent,
    SportsReportComponent,
    LoadingIconComponent,
    ImgCropperComponent,
    PrivacySettingDialogComponent,
    ActivityDetailComponent,
    MapChartCompareComponent,
    TrinomialChartComponent,
    QuadrantChartComponent,
    ThresholdInfoComponent,
    ThresholdChartComponent,
    TrendInfoChartComponent,
    MuscleMapCardComponent,
    LoadingBarComponent,
    EditIndividualPrivacyComponent,
    CloudrunMapComponent,
    EquidistantChartComponent,
    RelativeColumnChartComponent
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
    HoverHintComponent,
    DateRangePickerComponent,
    MuscleMapChartComponent,
    MuscleSvgIconComponent,
    CustomSelectComponent,
    ReportFilterComponent,
    SportsReportComponent,
    LoadingIconComponent,
    ImgCropperComponent,
    PrivacySettingDialogComponent,
    ActivityDetailComponent,
    MapChartCompareComponent,
    TrinomialChartComponent,
    EditIndividualPrivacyComponent,
    CloudrunMapComponent,
    LoadingBarComponent,
    ThresholdInfoComponent,
    ThresholdChartComponent,
    RelativeColumnChartComponent
  ]
})
export class SharedComponentsModule {}

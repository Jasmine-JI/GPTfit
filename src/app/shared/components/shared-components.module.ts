import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { Page404Component } from './page404/page404.component';
import { LoadingComponent } from './loading/loading.component';
import { UploadFileComponent } from './upload-file/upload-file.component';
import { RouterModule } from '@angular/router';
import { IntlPhoneInputComponent } from './intl-phone-input/intl-phone-input.component';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared.module';
import { MessageBoxComponent } from './message-box/message-box.component';
import { CustomMaterialModule } from '../../core/custom-material.module';
import { FormTextComponent } from './form-text/form-text.component';
import { FormRemindComponent } from './form-remind/form-remind.component';
import { FormTextareaComponent } from './form-textarea/form-textarea.component';
import { MemberCapsuleComponent } from './member-capsule/member-capsule.component';
import { Page403Component } from './page403/page403.component';
import { AlaIframeComponent } from './ala-iframe/ala-iframe.component';
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
import { ReportFilterComponent } from './report-filter/report-filter.component';
import { BottomSheetComponent } from './bottom-sheet/bottom-sheet.component';
import { SportsReportComponent } from './sports-report/sports-report.component';
import { LoadingIconComponent } from './loading-icon/loading-icon.component';
import { PrivacySettingDialogComponent } from './privacy-setting-dialog/privacy-setting-dialog.component';
import { ActivityDetailComponent } from './activity-detail/activity-detail.component';
import { MapChartCompareComponent } from './map-chart-compare/map-chart-compare.component';
import { TrinomialChartComponent } from './chart/trinomial-chart/trinomial-chart.component';
import { QuadrantChartComponent } from './chart/quadrant-chart/quadrant-chart.component';
import { ThresholdInfoComponent } from './chart/threshold-info/threshold-info.component';
import { ThresholdChartComponent } from './chart/threshold-chart/threshold-chart.component';
import { TrendInfoChartComponent } from './chart/trend-info-chart/trend-info-chart.component';
import { MuscleMapCardComponent } from './activity-detail/muscle-map-card/muscle-map-card.component';
import { EditIndividualPrivacyComponent } from './edit-individual-privacy/edit-individual-privacy.component';
import { CloudrunMapComponent } from './cloudrun-map/cloudrun-map.component';
import { EquidistantChartComponent } from './chart/equidistant-chart/equidistant-chart.component';
import { RelativeColumnChartComponent } from './chart/relative-column-chart/relative-column-chart.component';
import { TermsComponent } from './terms/terms.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { ConditionSelectorComponent } from './condition-selector/condition-selector.component';
import { CompareHrzoneTrendComponent } from './chart/compare-hrzone-trend/compare-hrzone-trend.component';
import { CompareColumnTrendComponent } from './chart/compare-column-trend/compare-column-trend.component';
import { TreeMapChartComponent } from './chart/tree-map-chart/tree-map-chart.component';
import { DistributionCanvasChartComponent } from './chart/distribution-canvas-chart/distribution-canvas-chart.component';
import { SportsTargetTipComponent } from './tooltips/sports-target-tip/sports-target-tip.component';
import { TargetAchieveChartComponent } from './chart/target-achieve-chart/target-achieve-chart.component';
import { CompareOverlayColumnChartComponent } from './chart/compare-overlay-column-chart/compare-overlay-column-chart.component';
import { CompareBodyWeightChartComponent } from './chart/compare-body-weight-chart/compare-body-weight-chart.component';
import { ComparePaceChartComponent } from './chart/compare-pace-chart/compare-pace-chart.component';
import { CompareExtremeGforceChartComponent } from './chart/compare-extreme-gforce-chart/compare-extreme-gforce-chart.component';
import { WeightTrainLevelSelectorComponent } from './weight-train-level-selector/weight-train-level-selector.component';
import {
  DateUnitKeyPipe,
  TranslateKeyPipe,
  TranslateUnitKeyPipe,
  DistanceSibsPipe,
  SportPaceSibsPipe,
  WeightSibsPipe,
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
import {
  CalenderSelectorComponent,
  LeafletMapComponent,
  GoogleMapComponent,
  AnalysisOptionComponent,
  SportsDataTableComponent,
  SportsFileRoadComponent,
  SportFileFooterComponent,
  TipDialogComponent,
  LoadingBarComponent,
  LoadingMaskComponent,
  ImgCropperComponent,
} from '../../components';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ImageCropperModule,
    ReactiveFormsModule,
    SharedModule,
    CustomMaterialModule,
    QRCodeModule,
    DateUnitKeyPipe,
    TranslateKeyPipe,
    TranslateUnitKeyPipe,
    DistanceSibsPipe,
    SportPaceSibsPipe,
    WeightSibsPipe,
    ProductTypePipe,
    CalenderSelectorComponent,
    LeafletMapComponent,
    GoogleMapComponent,
    AnalysisOptionComponent,
    SportsDataTableComponent,
    SportTypeIconPipe,
    SportsFileRoadComponent,
    SportFileFooterComponent,
    TipDialogComponent,
    LoadingBarComponent,
    LoadingMaskComponent,
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
    ImgCropperComponent,
  ],
  declarations: [
    NavbarComponent,
    Page404Component,
    LoadingComponent,
    UploadFileComponent,
    IntlPhoneInputComponent,
    MessageBoxComponent,
    FormTextComponent,
    FormRemindComponent,
    FormTextareaComponent,
    MemberCapsuleComponent,
    Page403Component,
    AlaIframeComponent,
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
    ReportFilterComponent,
    BottomSheetComponent,
    SportsReportComponent,
    LoadingIconComponent,
    PrivacySettingDialogComponent,
    ActivityDetailComponent,
    MapChartCompareComponent,
    TrinomialChartComponent,
    QuadrantChartComponent,
    ThresholdInfoComponent,
    ThresholdChartComponent,
    TrendInfoChartComponent,
    MuscleMapCardComponent,
    EditIndividualPrivacyComponent,
    CloudrunMapComponent,
    EquidistantChartComponent,
    RelativeColumnChartComponent,
    TermsComponent,
    PrivacyPolicyComponent,
    ConditionSelectorComponent,
    CompareHrzoneTrendComponent,
    CompareColumnTrendComponent,
    TreeMapChartComponent,
    DistributionCanvasChartComponent,
    SportsTargetTipComponent,
    TargetAchieveChartComponent,
    CompareOverlayColumnChartComponent,
    CompareBodyWeightChartComponent,
    ComparePaceChartComponent,
    CompareExtremeGforceChartComponent,
    WeightTrainLevelSelectorComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    NavbarComponent,
    Page404Component,
    Page403Component,
    LoadingComponent,
    UploadFileComponent,
    IntlPhoneInputComponent,
    MessageBoxComponent,
    FormTextComponent,
    FormRemindComponent,
    FormTextareaComponent,
    MemberCapsuleComponent,
    AlaIframeComponent,
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
    ReportFilterComponent,
    SportsReportComponent,
    LoadingIconComponent,
    PrivacySettingDialogComponent,
    ActivityDetailComponent,
    MapChartCompareComponent,
    TrinomialChartComponent,
    EditIndividualPrivacyComponent,
    CloudrunMapComponent,
    ThresholdInfoComponent,
    ThresholdChartComponent,
    RelativeColumnChartComponent,
    TermsComponent,
    PrivacyPolicyComponent,
    ConditionSelectorComponent,
    CompareHrzoneTrendComponent,
    CompareColumnTrendComponent,
    TreeMapChartComponent,
    DistributionCanvasChartComponent,
    SportsTargetTipComponent,
    TargetAchieveChartComponent,
    CompareOverlayColumnChartComponent,
    CompareBodyWeightChartComponent,
    ComparePaceChartComponent,
    CompareExtremeGforceChartComponent,
    WeightTrainLevelSelectorComponent,
  ],
})
export class SharedComponentsModule {}

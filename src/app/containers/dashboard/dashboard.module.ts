import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { FormsModule } from '@angular/forms';
import { CustomMaterialModule } from '../../core/custom-material.module';
import { GpxService } from './services/gpx.service';
import { MsgDialogComponent } from './components/msg-dialog/msg-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DeviceLogComponent } from './components/device-log/device-log.component';
import { DeviceLogService } from './services/device-log.service';
import { DeviceLogDetailComponent } from './components/device-log-detail/device-log-detail.component';
import { CoachDashboardComponent } from './components/coach-dashboard/coach-dashboard.component';
import { SharedModule } from '../../shared/shared.module';
import { EditGroupGuard } from './guards/edit-group-guard';
import { InnerSettingsComponent } from './components/inner-settings/inner-settings.component';
import { PeopleSelectorWinComponent } from './components/people-selector-win/people-selector-win.component';
import { DashboardGuard } from './guards/dashboard-guard';
import { MyDeviceComponent } from './components/my-device/my-device.component';
import { TrainLiveComponent } from './components/train-live/train-live.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from '../../core/interceptors/token.interceptor';
import { InnerTestComponent } from './components/inner-test/inner-test.component';
import { CloudRunGpxComponent } from './components/cloud-run-gpx/cloud-run-gpx.component';
import { InnerAdminService } from './services/inner-admin.service';
import { QRCodeModule } from 'angularx-qrcode';
import { InnerDevicePairComponent } from './components/inner-device-pair/inner-device-pair.component';
import { LifeTrackingComponent } from './components/life-tracking/life-tracking.component';
import { LifeTrackingService } from './services/life-tracking.service';
import { QrcodeUploadComponent } from './components/qrcode-upload/qrcode-upload.component';
import { GroupSearchComponent } from './group/group-search/group-search.component';
import { AllGroupListComponent } from './group/all-group-list/all-group-list.component';
import { MyGroupListComponent } from './group/my-group-list/my-group-list.component';
import { CreateGroupComponent } from './group/create-group/create-group.component';
import { CommercePlanTableComponent } from './group/commerce-plan-table/commerce-plan-table.component';
import { GroupInfoComponent as GroupInfoV2Component } from './group-v2/group-info/group-info.component';
import { GroupIntroductionComponent } from './group-v2/group-info/group-introduction/group-introduction.component';
import { SportsReportComponent } from './group-v2/group-info/sports-report/sports-report.component';
import { LifeTrackingComponent as LifeTrackingV2Component } from './group-v2/group-info/life-tracking/life-tracking.component';
import { MyClassReportComponent } from './group-v2/group-info/my-class-report/my-class-report.component';
import { ClassAnalysisComponent as ClassAnalysisV2Component } from './group-v2/group-info/class-analysis/class-analysis.component';
import { CommercePlanComponent } from './group-v2/group-info/commerce-plan/commerce-plan.component';
import { MemberListComponent } from './group-v2/group-info/member-list/member-list.component';
import { AdminListComponent } from './group-v2/group-info/admin-list/admin-list.component';
import { GroupArchitectureComponent } from './group-v2/group-info/group-architecture/group-architecture.component';
import { CloudrunReportComponent } from './group-v2/group-info/cloudrun-report/cloudrun-report.component';
import { EditPushMessageComponent } from './components/push-message/edit-push-message/edit-push-message.component';
import { PushMessageListComponent } from './components/push-message/push-message-list/push-message-list.component';
import { SystemLogComponent } from './components/system-log/system-log.component';
import { SystemFolderPermissionComponent } from './components/system-folder-permission/system-folder-permission.component';
import { AlaAppAnalysisComponent } from './components/ala-app-analysis/ala-app-analysis.component';
import { CloudrunReportComponent as PersonCloudrunReport } from './components/cloudrun-report/cloudrun-report.component';
import { DeviceInfoComponent } from './components/device-info/device-info.component';
import { DeviceListComponent } from './group-v2/group-info/device-list/device-list.component';
import { PersonalComponent } from './personal/personal.component';
import { InfoComponent } from './personal/info/info.component';
import { SettingBaseComponent } from './personal/setting-base/setting-base.component';
import { SettingPreferComponent } from './personal/setting-prefer/setting-prefer.component';
import { SettingPrivacyComponent } from './personal/setting-privacy/setting-privacy.component';
import { SettingAccountComponent } from './personal/setting-account/setting-account.component';
import { ActivityListComponent } from './personal/activity-list/activity-list.component';
import { StationMailModule } from '../station-mail/station-mail.module';
import { GsensorComponent } from './components/gsensor/gsensor.component';
import {
  SportTargetSettingComponent,
  FeatureNounTipsComponent,
  LeafletMapComponent,
  GoogleMapComponent,
  SportsDataTableComponent,
  AnalysisOptionComponent,
  SmallHrzoneChartComponent,
  AnalysisInfoMenuComponent,
  SportFileFooterComponent,
  StationAnalysisListComponent,
  GroupAnalysisCalenderComponent,
  PieChartComponent,
  HrZoneChartComponent,
  LineCompareChartComponent,
  TipDialogComponent,
  LoadingBarComponent,
  LoadingMaskComponent,
  PaginationComponent,
  ImgCropperComponent,
  ShareBoxComponent,
  // AlapointAchievementComponent
} from '../../components';
import {
  DateUnitKeyPipe,
  TranslateKeyPipe,
  TranslateUnitKeyPipe,
  ReferenceHrZonePipe,
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
  HashIdService,
  DetectInappService,
  HintDialogService,
  ApiCommonService,
  NodejsApiService,
  QrcodeService,
} from '../../core/services';
import { MemberAnalysisListComponent } from '../professional';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    DashboardRoutingModule,
    CommonModule,
    TranslateModule,
    FormsModule,
    CustomMaterialModule,
    ReactiveFormsModule,
    SharedModule,
    SharedComponentsModule,
    QRCodeModule,
    StationMailModule,
    SportTargetSettingComponent,
    DateUnitKeyPipe,
    TranslateKeyPipe,
    TranslateUnitKeyPipe,
    FeatureNounTipsComponent,
    ReferenceHrZonePipe,
    DistanceSibsPipe,
    SportPaceSibsPipe,
    WeightSibsPipe,
    ProductTypePipe,
    LeafletMapComponent,
    GoogleMapComponent,
    SportsDataTableComponent,
    AnalysisOptionComponent,
    SmallHrzoneChartComponent,
    AnalysisInfoMenuComponent,
    SportTypeIconPipe,
    SportFileFooterComponent,
    StationAnalysisListComponent,
    GroupAnalysisCalenderComponent,
    PieChartComponent,
    HrZoneChartComponent,
    LineCompareChartComponent,
    TipDialogComponent,
    LoadingBarComponent,
    LoadingMaskComponent,
    PaginationComponent,
    ImgCropperComponent,
    ShareBoxComponent,
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
    MemberAnalysisListComponent,
    DashboardComponent,
    MsgDialogComponent,
    DeviceLogComponent,
    DeviceLogDetailComponent,
    CoachDashboardComponent,
    InnerSettingsComponent,
    PeopleSelectorWinComponent,
    MyDeviceComponent,
    TrainLiveComponent,
    InnerTestComponent,
    CloudRunGpxComponent,
    InnerDevicePairComponent,
    LifeTrackingComponent,
    GroupSearchComponent,
    AllGroupListComponent,
    MyGroupListComponent,
    CreateGroupComponent,
    CommercePlanTableComponent,
    QrcodeUploadComponent,
    GroupInfoV2Component,
    GroupIntroductionComponent,
    SportsReportComponent,
    LifeTrackingV2Component,
    MyClassReportComponent,
    ClassAnalysisV2Component,
    CommercePlanComponent,
    MemberListComponent,
    AdminListComponent,
    GroupArchitectureComponent,
    CloudrunReportComponent,
    EditPushMessageComponent,
    PushMessageListComponent,
    SystemLogComponent,
    SystemFolderPermissionComponent,
    AlaAppAnalysisComponent,
    PersonCloudrunReport,
    DeviceInfoComponent,
    DeviceListComponent,
    PersonalComponent,
    InfoComponent,
    SettingBaseComponent,
    SettingPreferComponent,
    SettingPrivacyComponent,
    SettingAccountComponent,
    ActivityListComponent,
    GsensorComponent,
    // AlapointAchievementComponent
  ],
  providers: [
    GpxService,
    DeviceLogService,
    EditGroupGuard,
    DashboardGuard,
    HashIdService,
    InnerAdminService,
    DetectInappService,
    HintDialogService,
    ApiCommonService,
    NodejsApiService,
    QrcodeService,
    LifeTrackingService,
    PersonCloudrunReport,
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
      useClass: TokenInterceptor,
      multi: true,
    },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardModule {}

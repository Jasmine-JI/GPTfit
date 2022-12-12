import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { CustomMaterialModule } from '../../core/custom-material.module';
import { GpxService } from './services/gpx.service';
import { MsgDialogComponent } from './components/msg-dialog/msg-dialog.component';
import { SharedPipes } from '../../shared/pipes/shared-pipes';
import { ReactiveFormsModule } from '@angular/forms';
import { DeviceLogComponent } from './components/device-log/device-log.component';
import { DeviceLogService } from './services/device-log.service';
import { DeviceLogDetailComponent } from './components/device-log-detail/device-log-detail.component';
import { CoachDashboardComponent } from './components/coach-dashboard/coach-dashboard.component';
import { SharedModule } from '../../shared/shared.module';
import { AccessNamePipe } from './pipes/access-name.pipe';
import { EditGroupGuard } from './guards/edit-group-guard';
import { InnerSettingsComponent } from './components/inner-settings/inner-settings.component';
import { PeopleSelectorWinComponent } from './components/people-selector-win/people-selector-win.component';
import { DashboardGuard } from './guards/dashboard-guard';
import { ProductErrorLogPipe } from './pipes/product-error-log.pipe';
import { NgProgressModule } from '@ngx-progressbar/core';
import { MyDeviceComponent } from './components/my-device/my-device.component';
import { TrainLiveComponent } from './components/train-live/train-live.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from '../../core/interceptors/token.interceptor';
import { InnerTestComponent } from './components/inner-test/inner-test.component';
import { HashIdService, DetectInappService } from '../../core/services';
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
import { SearchGroupComponent } from './group-v2/search-group/search-group.component';
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
  SportTargetSettingModule,
  FeatureNounTipsModule,
  LeafletMapModule,
  GoogleMapModule,
  SportsDataTableModule,
  AnalysisOptionModule,
  SmallHrzoneChartModule,
  AnalysisInfoMenuModule,
} from '../../components';
import {
  DateUnitKeyModule,
  TranslateKeyModule,
  TranslateUnitKeyModule,
  ReferenceHrZoneModule,
  DistanceSibsModule,
  SportPaceSibsModule,
  WeightSibsModule,
  SportTypeIconModule,
} from '../../core/pipes';

@NgModule({
  imports: [
    DashboardRoutingModule,
    CommonModule,
    SharedComponentsModule,
    FormsModule,
    MyDatePickerModule,
    CustomMaterialModule,
    SharedPipes,
    ReactiveFormsModule,
    SharedModule,
    NgProgressModule,
    QRCodeModule,
    StationMailModule,
    SportTargetSettingModule,
    DateUnitKeyModule,
    TranslateKeyModule,
    TranslateUnitKeyModule,
    FeatureNounTipsModule,
    ReferenceHrZoneModule,
    DistanceSibsModule,
    SportPaceSibsModule,
    WeightSibsModule,
    LeafletMapModule,
    GoogleMapModule,
    SportsDataTableModule,
    AnalysisOptionModule,
    SmallHrzoneChartModule,
    AnalysisInfoMenuModule,
    SportTypeIconModule,
  ],
  providers: [
    GpxService,
    DeviceLogService,
    EditGroupGuard,
    DashboardGuard,
    HashIdService,
    InnerAdminService,
    DetectInappService,
    LifeTrackingService,
    PersonCloudrunReport,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
  ],
  declarations: [
    DashboardComponent,
    MsgDialogComponent,
    DeviceLogComponent,
    DeviceLogDetailComponent,
    CoachDashboardComponent,
    AccessNamePipe,
    InnerSettingsComponent,
    PeopleSelectorWinComponent,
    ProductErrorLogPipe,
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
    SearchGroupComponent,
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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardModule {}

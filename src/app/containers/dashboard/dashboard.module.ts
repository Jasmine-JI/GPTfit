import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { FormsModule } from '@angular/forms';
import { CertificateComponent } from './components/certificate/certificate.component';
import { MyDatePickerModule } from 'mydatepicker';
import { MapService } from '../../shared/services/map.service';
import { CustomMaterialModule } from '../../shared/custom-material.module';
import { GlobalEventsManager } from '../../shared/global-events-manager';
import { GpxService } from './services/gpx.service';
import { MsgDialogComponent } from './components/msg-dialog/msg-dialog.component';
import { SharedPipes } from '../../shared/pipes/shared-pipes';
import { ReactiveFormsModule } from '@angular/forms';
import { DeviceLogComponent } from './components/device-log/device-log.component';
import { DeviceLogService } from './services/device-log.service';
import { DeviceLogDetailComponent } from './components/device-log-detail/device-log-detail.component';
import { CoachDashboardComponent } from './components/coach-dashboard/coach-dashboard.component';
import { CoachService } from './services/coach.service';
import { UserInfoService } from './services/userInfo.service';
import { UtilsService } from '../../shared/services/utils.service';
import { SharedModule } from '../../shared/shared.module';
import { GroupService } from './services/group.service';
import { AccessNamePipe } from './pipes/access-name.pipe';
import { EditGroupGuard } from './guards/edit-group-guard';
import { InnerSettingsComponent } from './components/inner-settings/inner-settings.component';
import { PeopleSelectorWinComponent } from './components/people-selector-win/people-selector-win.component';
import { DashboardGuard } from './guards/dashboard-guard';
import { UnsaveGuard } from '../dashboard/guards/unsave-guard';
import { ActivityService } from '../../shared/services/activity.service';
import { ProductErrorLogPipe } from './pipes/product-error-log.pipe';
import { NgProgressModule } from '@ngx-progressbar/core';
import { MyDeviceComponent } from './components/device/my-device/my-device.component';
import { ProductInfoComponent } from './components/device/product-info/product-info.component';
import { ReportService } from '../../shared/services/report.service';
import { TrainLiveComponent } from './components/train-live/train-live.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from '../../shared/interceptors/token.interceptor';
import { SettingsComponent } from './components/settings/settings.component';
import { UserSettingsComponent } from './components/settings/user-settings/user-settings.component';
import { PrivacySettingsComponent } from './components/settings/privacy-settings/privacy-settings.component';
import { AccountInfoComponent } from './components/settings/account-info/account-info.component';
import { SettingsService } from './services/settings.service';
import { UserProfileService } from '../../shared/services/user-profile.service';
import { PersonalPreferencesComponent } from './components/settings/personal-preferences/personal-preferences.component';
import { InnerTestComponent } from './components/inner-test/inner-test.component';
import { HashIdService } from '../../shared/services/hash-id.service';
import { CloudRunGpxComponent } from './components/cloud-run-gpx/cloud-run-gpx.component';
import { InnerAdminService } from './services/inner-admin.service';
import { ActivityOtherDetailsService } from '../../shared/services/activity-other-details.service';
import { DetectInappService } from '../../shared/services/detect-inapp.service';
import { QRCodeModule } from 'angularx-qrcode';
import { InnerDevicePairComponent } from './components/inner-device-pair/inner-device-pair.component';
import { ShareGroupInfoDialogComponent } from '../../shared/components/share-group-info-dialog/share-group-info-dialog.component';
import { LifeTrackingComponent } from './components/life-tracking/life-tracking.component';
import { LifeTrackingService } from './services/life-tracking.service';
import { ModifyBoxComponent } from './components/settings/privacy-settings/modify-box/modify-box.component';
import { QrcodeUploadComponent } from './components/qrcode-upload/qrcode-upload.component';
import { OfficialActivityService } from '../../shared/services/official-activity.service';

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
import { ActivityListManageComponent } from './components/official-activity-manage/activity-list-manage/activity-list-manage.component';
import { EditOfficialActivityComponent } from './components/official-activity-manage/edit-official-activity/edit-official-activity.component';
import { ParticipantsManageComponent } from './components/official-activity-manage/participants-manage/participants-manage.component';
import { EditPushMessageComponent } from './components/push-message/edit-push-message/edit-push-message.component';
import { PushMessageListComponent } from './components/push-message/push-message-list/push-message-list.component';
import { SystemLogComponent } from './components/system-log/system-log.component';
import { SystemFolderPermissionComponent } from './components/system-folder-permission/system-folder-permission.component';
import { AlaAppAnalysisComponent } from './components/ala-app-analysis/ala-app-analysis.component';
import { CloudrunReportComponent as PersonCloudrunReport } from './components/cloudrun-report/cloudrun-report.component';
import { DeviceInfoComponent } from './components/device-info/device-info.component'


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
    QRCodeModule
  ],
  providers: [
    MapService,
    GlobalEventsManager,
    GpxService,
    DeviceLogService,
    CoachService,
    UserInfoService,
    UtilsService,
    GroupService,
    EditGroupGuard,
    DashboardGuard,
    UnsaveGuard,
    ActivityService,
    ReportService,
    SettingsService,
    UserProfileService,
    HashIdService,
    InnerAdminService,
    ActivityOtherDetailsService,
    DetectInappService,
    LifeTrackingService,
    OfficialActivityService,
    PersonCloudrunReport,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  declarations: [
    DashboardComponent,
    CertificateComponent,
    MsgDialogComponent,
    DeviceLogComponent,
    DeviceLogDetailComponent,
    CoachDashboardComponent,
    AccessNamePipe,
    InnerSettingsComponent,
    PeopleSelectorWinComponent,
    ProductErrorLogPipe,
    MyDeviceComponent,
    ProductInfoComponent,
    TrainLiveComponent,
    SettingsComponent,
    UserSettingsComponent,
    PrivacySettingsComponent,
    AccountInfoComponent,
    PersonalPreferencesComponent,
    InnerTestComponent,
    CloudRunGpxComponent,
    InnerDevicePairComponent,
    LifeTrackingComponent,
    GroupSearchComponent,
    AllGroupListComponent,
    MyGroupListComponent,
    CreateGroupComponent,
    CommercePlanTableComponent,
    ModifyBoxComponent,
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
    ActivityListManageComponent,
    EditOfficialActivityComponent,
    ParticipantsManageComponent,
    EditPushMessageComponent,
    PushMessageListComponent,
    SystemLogComponent,
    SystemFolderPermissionComponent,
    AlaAppAnalysisComponent,
    PersonCloudrunReport,
    DeviceInfoComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    MsgDialogComponent,
    PeopleSelectorWinComponent,
    ShareGroupInfoDialogComponent,
    ModifyBoxComponent
  ]
})
export class DashboardModule {}

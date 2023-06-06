import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { DeviceLogComponent } from './components/device-log/device-log.component';
import { DeviceLogDetailComponent } from './components/device-log-detail/device-log-detail.component';
import { CoachDashboardComponent } from './components/coach-dashboard/coach-dashboard.component';
import { AuthGuard } from '../../core/guard/auth/auth.guard';
import { GroupSearchComponent } from './group/group-search/group-search.component';
import { AllGroupListComponent } from './group/all-group-list/all-group-list.component';
import { InnerSettingsComponent } from './components/inner-settings/inner-settings.component';
import { DashboardGuard } from './guards/dashboard-guard';
import { SportsReportComponent } from '../../shared/components/sports-report/sports-report.component';
import { MyDeviceComponent } from './components/my-device/my-device.component';
import { TrainLiveComponent } from './components/train-live/train-live.component';
import { InnerTestComponent } from './components/inner-test/inner-test.component';
import { CloudRunGpxComponent } from './components/cloud-run-gpx/cloud-run-gpx.component';
import { InnerDevicePairComponent } from './components/inner-device-pair/inner-device-pair.component';
import { LifeTrackingComponent } from './components/life-tracking/life-tracking.component';
import { MyLifeTrackingComponent } from '../../shared/components/my-life-tracking/my-life-tracking.component';
import { QrcodeUploadComponent } from './components/qrcode-upload/qrcode-upload.component';
import { EditPushMessageComponent } from './components/push-message/edit-push-message/edit-push-message.component';
import { PushMessageListComponent } from './components/push-message/push-message-list/push-message-list.component';
import { GroupInfoComponent } from './group-v2/group-info/group-info.component';
import { MyGroupListComponent } from './group/my-group-list/my-group-list.component';
import { CreateGroupComponent } from './group/create-group/create-group.component';
// import { MyGroupListComponent } from './group-v2/my-group-list/my-group-list.component';
import { GroupIntroductionComponent } from './group-v2/group-info/group-introduction/group-introduction.component';
import { SportsReportComponent as GroupSportsReportComponent } from './group-v2/group-info/sports-report/sports-report.component';
import { MyClassReportComponent } from './group-v2/group-info/my-class-report/my-class-report.component';
import { CommercePlanComponent } from './group-v2/group-info/commerce-plan/commerce-plan.component';
import { MemberListComponent } from './group-v2/group-info/member-list/member-list.component';
import { AdminListComponent } from './group-v2/group-info/admin-list/admin-list.component';
import { GroupArchitectureComponent } from './group-v2/group-info/group-architecture/group-architecture.component';
import { CloudrunReportComponent } from './group-v2/group-info/cloudrun-report/cloudrun-report.component';
import { LifeTrackingComponent as LifeTrackingV2Component } from './group-v2/group-info/life-tracking/life-tracking.component';
import { ClassAnalysisComponent } from './group-v2/group-info/class-analysis/class-analysis.component';
import { ActivityDetailComponent } from '../../shared/components/activity-detail/activity-detail.component';
import { SystemLogComponent } from './components/system-log/system-log.component';
import { SystemFolderPermissionComponent } from './components/system-folder-permission/system-folder-permission.component';
import { AlaAppAnalysisComponent } from './components/ala-app-analysis/ala-app-analysis.component';
import { CloudrunReportComponent as PersonCloudrunReport } from './components/cloudrun-report/cloudrun-report.component';
import { DeviceInfoComponent } from './components/device-info/device-info.component';
import { DeviceListComponent } from './group-v2/group-info/device-list/device-list.component';
import { PersonalComponent } from './personal/personal.component';
import { InfoComponent } from './personal/info/info.component';
import { ActivityListComponent } from './personal/activity-list/activity-list.component';
import { StationMailComponent } from '../station-mail/station-mail.component';
import { CreateMailComponent } from '../station-mail/create-mail/create-mail.component';
import { InboxComponent } from '../station-mail/inbox/inbox.component';
import { MailDetailComponent } from '../station-mail/mail-detail/mail-detail.component';
import { ReceiverListComponent } from '../station-mail/receiver-list/receiver-list.component';
import { appPath } from '../../app-path.const';
import { GsensorComponent } from './components/gsensor/gsensor.component';
import { Page404Component } from '../../shared/components/page404/page404.component';
import { Page403Component } from '../../shared/components/page403/page403.component';
import { GroupAnalysisReportComponent } from '../professional';
import { SportsDetailComponent } from '../personal';

const {
  personal,
  professional,
  device,
  adminManage,
  stationMail,
  dashboard,
  gsensor,
  pageNoPermission,
  pageNotFound,
  qrcodeUploadData,
} = appPath;

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: `${dashboard.coachDashboard}/:${dashboard.classId}`,
        component: CoachDashboardComponent,
      },
      {
        path: adminManage.home,
        canActivate: [DashboardGuard],
        children: [
          {
            path: adminManage.settingMember,
            component: InnerSettingsComponent,
          },
          {
            path: adminManage.deviceLog.home,
            children: [
              {
                path: `${adminManage.deviceLog.detail}/:${personal.userId}`,
                component: DeviceLogDetailComponent,
              },
              {
                path: '',
                component: DeviceLogComponent,
              },
            ],
          },

          {
            path: adminManage.allGroupList,
            component: AllGroupListComponent,
          },
          {
            path: adminManage.createBrandGroup,
            component: CreateGroupComponent,
          },
          {
            path: adminManage.createComGroup,
            component: CreateGroupComponent,
          },
          {
            path: adminManage.innerTest,
            component: InnerTestComponent,
          },
          {
            path: adminManage.innerGpx,
            component: CloudRunGpxComponent,
          },
          {
            path: adminManage.devicePairManagement,
            component: InnerDevicePairComponent,
          },
          {
            path: `${device.home}/${device.info}/:${device.deviceSn}`,
            component: DeviceInfoComponent,
          },
          {
            path: adminManage.lifeTracking,
            component: LifeTrackingComponent,
          },
          {
            path: adminManage.createPush,
            component: EditPushMessageComponent,
          },
          {
            path: adminManage.pushDetail,
            component: EditPushMessageComponent,
          },
          {
            path: adminManage.pushList,
            component: PushMessageListComponent,
          },
          {
            path: adminManage.systemLog,
            component: SystemLogComponent,
          },
          {
            path: adminManage.folderPermission,
            component: SystemFolderPermissionComponent,
          },
          {
            path: adminManage.alaAppAnalysis,
            component: AlaAppAnalysisComponent,
          },
          {
            path: adminManage.systemOperationReport,
            loadComponent: () =>
              import(
                '../admin-manage/system-operation-report/system-operation-report.component'
              ).then((m) => m.SystemOperationReportComponent),
          },
          {
            path: adminManage.groupOperationList,
            loadComponent: () =>
              import('../admin-manage/group-operation-list/group-operation-list.component').then(
                (m) => m.GroupOperationListComponent
              ),
          },
        ],
      },
      {
        path: `${personal.activityDetail}/:${personal.fileId}`,
        component: ActivityDetailComponent,
        // component: SportsDetailComponent,
      },
      {
        path: device.home,
        children: [
          {
            path: `${device.info}/:${device.deviceSn}`,
            component: DeviceInfoComponent,
          },
          {
            path: '',
            component: MyDeviceComponent,
          },
        ],
      },
      {
        path: dashboard.trainLive,
        component: TrainLiveComponent,
      },
      {
        path: qrcodeUploadData,
        component: QrcodeUploadComponent,
      },
      {
        path: `${professional.groupDetail.home}/:${professional.groupId}`,
        component: GroupInfoComponent,
        children: [
          {
            path: professional.groupDetail.introduction,
            component: GroupIntroductionComponent,
          },
          {
            path: professional.groupDetail.commercePlan,
            component: CommercePlanComponent,
          },
          {
            path: professional.groupDetail.groupArchitecture,
            component: GroupArchitectureComponent,
          },
          {
            path: professional.groupDetail.memberList,
            component: MemberListComponent,
          },
          {
            path: professional.groupDetail.adminList,
            component: AdminListComponent,
          },
          {
            path: professional.groupDetail.operationReport,
            component: GroupAnalysisReportComponent,
          },
          {
            path: professional.groupDetail.myclassReport,
            component: MyClassReportComponent,
          },
          {
            path: professional.groupDetail.classAnalysis,
            component: ClassAnalysisComponent,
          },
          {
            path: professional.groupDetail.sportsReport,
            component: GroupSportsReportComponent,
          },
          {
            path: professional.groupDetail.lifeTracking,
            component: LifeTrackingV2Component,
          },
          {
            path: professional.groupDetail.cloudrunReport,
            component: CloudrunReportComponent,
          },
          {
            path: professional.groupDetail.deviceList,
            component: DeviceListComponent,
          },
        ],
      },
      {
        path: professional.myGroupList,
        component: MyGroupListComponent,
      },
      {
        path: professional.groupSearch,
        component: GroupSearchComponent,
      },
      {
        path: personal.userSettings,
        component: PersonalComponent,
      },
      {
        path: personal.stravaRedirectSettings,
        component: PersonalComponent,
      },
      {
        path: '',
        component: PersonalComponent,
        children: [
          {
            path: personal.activityList,
            component: ActivityListComponent,
          },
          {
            path: personal.sportsReport,
            component: SportsReportComponent,
          },
          {
            path: personal.lifeTracking,
            component: MyLifeTrackingComponent,
          },
          {
            path: personal.cloudrun,
            component: PersonCloudrunReport,
          },
          {
            path: personal.info,
            component: InfoComponent,
          },
          {
            path: '',
            redirectTo: personal.activityList,
            pathMatch: 'full',
          },
        ],
      },
      {
        path: stationMail.home,
        component: StationMailComponent,
        children: [
          {
            path: stationMail.newMail,
            component: CreateMailComponent,
          },
          {
            path: stationMail.inbox,
            component: InboxComponent,
          },
          {
            path: stationMail.mailDetail,
            component: MailDetailComponent,
          },
          {
            path: stationMail.receiverList,
            component: ReceiverListComponent,
          },
        ],
      },
      {
        path: gsensor,
        component: GsensorComponent,
      },
      {
        path: pageNoPermission,
        component: Page403Component,
      },
      {
        path: pageNotFound,
        component: Page404Component,
      },
      {
        path: '**',
        redirectTo: pageNotFound,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}

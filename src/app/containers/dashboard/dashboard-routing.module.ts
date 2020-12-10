import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { EnrollFormComponent } from './components/enroll-form/enroll-form.component';
import { CertificateComponent } from './components/certificate/certificate.component';
import { CertificatePreviewComponent } from './components/certificate-preview/certificate-preview.component';
import { EventCalendarComponent } from './components/event-calendar/event-calendar.component';
import { EnrollPreviewComponent } from './components/enroll-preview/enroll-preview.component';
import { LeaderboardSettingsComponent } from './components/leaderboard-settings/leaderboard-settings.component';
import { RealTimeLeaderboardComponent } from './components/real-time-leaderboard/real-time-leaderboard.component';
import { DbMaintainComponent } from './components/db-maintain/db-maintain.component';
import { DeviceLogComponent } from './components/device-log/device-log.component';
import { DeviceLogDetailComponent } from './components/device-log-detail/device-log-detail.component';
import { CoachDashboardComponent } from './components/coach-dashboard/coach-dashboard.component';
import { AuthGuard } from '@shared/guards/auth/auth.guard';
import { UnsaveGuard } from '../dashboard/guards/unsave-guard';
import { GroupSearchComponent } from './group/group-search/group-search.component';
import { EditGroupInfoComponent } from './group/edit-group-info/edit-group-info.component';
import { AllGroupListComponent } from './group/all-group-list/all-group-list.component';
import { EditGroupGuard } from './guards/edit-group-guard';
import { CreateGroupComponent } from './group/create-group/create-group.component';
import { InnerSettingsComponent } from './components/inner-settings/inner-settings.component';
import { DashboardGuard } from './guards/dashboard-guard';
import { ActivityInfoComponent } from '@shared/components/activity-info/activity-info.component';
import { MyActivityComponent } from '@shared/components/my-activity/my-activity.component';
import { SportReportComponent } from '@shared/components/sport-report/sport-report.component';
import { MyDeviceComponent } from './components/device/my-device/my-device.component';
import { ProductInfoComponent } from './components/device/product-info/product-info.component';
import { TrainLiveComponent } from './components/train-live/train-live.component';
import { SettingsComponent } from './components/settings/settings.component';
import { PersonalPreferencesComponent } from './components/settings/personal-preferences/personal-preferences.component';
import { InnerTestComponent } from './components/inner-test/inner-test.component';
import { CloudRunGpxComponent } from './components/cloud-run-gpx/cloud-run-gpx.component';
import { InnerDevicePairComponent } from './components/inner-device-pair/inner-device-pair.component';
import { LifeTrackingComponent } from './components/life-tracking/life-tracking.component';
import { MyLifeTrackingComponent } from '@shared/components/my-life-tracking/my-life-tracking.component';
import { QrcodeUploadComponent } from './components/qrcode-upload/qrcode-upload.component';
import { EditPushMessageComponent } from './components/push-message/edit-push-message/edit-push-message.component';
import { PushMessageListComponent } from './components/push-message/push-message-list/push-message-list.component';

import { GroupInfoComponent } from './group-v2/group-info/group-info.component';
import { SearchGroupComponent } from './group-v2/search-group/search-group.component';
import { MyGroupListComponent } from './group/my-group-list/my-group-list.component';
// import { MyGroupListComponent } from './group-v2/my-group-list/my-group-list.component';
import { GroupIntroductionComponent } from './group-v2/group-info/group-introduction/group-introduction.component';
import { SportsReportComponent } from './group-v2/group-info/sports-report/sports-report.component';
import { MyClassReportComponent } from './group-v2/group-info/my-class-report/my-class-report.component';
import { CommercePlanComponent } from './group-v2/group-info/commerce-plan/commerce-plan.component';
import { MemberListComponent } from './group-v2/group-info/member-list/member-list.component';
import { AdminListComponent } from './group-v2/group-info/admin-list/admin-list.component';
import { GroupArchitectureComponent } from './group-v2/group-info/group-architecture/group-architecture.component';
import { CloudrunReportComponent } from './group-v2/group-info/cloudrun-report/cloudrun-report.component';
import { LifeTrackingComponent as LifeTrackingV2Component } from './group-v2/group-info/life-tracking/life-tracking.component';
import { ClassAnalysisComponent } from './group-v2/group-info/class-analysis/class-analysis.component';
import { ActivityListManageComponent } from './components/official-activity-manage/activity-list-manage/activity-list-manage.component';
import { EditOfficialActivityComponent } from './components/official-activity-manage/edit-official-activity/edit-official-activity.component';
import { ParticipantsManageComponent } from './components/official-activity-manage/participants-manage/participants-manage.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'enroll/:event_id',
        component: EnrollFormComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'certificate',
        component: CertificateComponent
      },
      {
        path: 'certificate/preview',
        component: CertificatePreviewComponent
      },
      {
        path: 'enroll/:event_id/preview',
        component: EnrollPreviewComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'real-time-leaderboard',
        component: RealTimeLeaderboardComponent
      },
      {
        path: 'db',
        component: DbMaintainComponent
      },
      {
        path: 'coach-dashboard/:classId',
        component: CoachDashboardComponent
      },
      {
        path: 'my-group-list',
        component: MyGroupListComponent
      },
      {
        path: 'group-search',
        component: GroupSearchComponent
      },
      {
        path: 'system/event-management',
        component: ActivityListManageComponent,
        canActivate: [DashboardGuard],
      },
      {
        path: 'system/event-management/edit',
        component: EditOfficialActivityComponent,
        canActivate: [DashboardGuard],
        canDeactivate: [UnsaveGuard]
      },
      {
        path: 'system/event-management/participants',
        component: ParticipantsManageComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/event-calendar',
        component: EventCalendarComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/leaderboard-settings',
        component: LeaderboardSettingsComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/setting-member',
        component: InnerSettingsComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/device_log',
        component: DeviceLogComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/device_log/detail/:userId',
        component: DeviceLogDetailComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/all-group-list',
        component: AllGroupListComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/create-brand-group',
        component: CreateGroupComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/create-com-group',
        component: CreateGroupComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/inner-test',
        component: InnerTestComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/inner-gpx',
        component: CloudRunGpxComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/device-pair-management',
        component: InnerDevicePairComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/device/info/:deviceSN',
        component: ProductInfoComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/life-tracking',
        component: LifeTrackingComponent
      },
      {
        path: 'system/create-push',
        component: EditPushMessageComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/push-detail',
        component: EditPushMessageComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/push-list',
        component: PushMessageListComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'settings',
        component: SettingsComponent,
        children: [
          {
            path: 'user-settings',
            component: SettingsComponent
          },
          {
            path: 'privacy-settings',
            component: SettingsComponent
          },
          {
            path: 'account-info',
            component: SettingsComponent
          },
          {
            path: 'personal-preferences',
            component: PersonalPreferencesComponent
          }
        ]
      },
      {
        path: 'activity-list',
        component: MyActivityComponent
      },
      {
        path: 'activity/:fileId',
        component: ActivityInfoComponent
      },
      {
        path: 'sport-report',
        component: SportReportComponent
      },
      {
        path: 'life-tracking',
        component: MyLifeTrackingComponent
      },
      {
        path: 'device',
        component: MyDeviceComponent
      },
      {
        path: 'device/info/:deviceSN',
        component: ProductInfoComponent
      },
      {
        path: 'live/train-live',
        component: TrainLiveComponent
      },
      {
        path: 'qrupload/activityfile',
        component: QrcodeUploadComponent
      },

      {
        path: 'group-info/:groupId',
        component: GroupInfoComponent,
        children: [
          {
            path: 'group-introduction',
            component: GroupIntroductionComponent
          },
          {
            path: 'commerce-plan',
            component: CommercePlanComponent
          },
          {
            path: 'group-architecture',
            component: GroupArchitectureComponent
          },
          {
            path: 'member-list',
            component: MemberListComponent
          },
          {
            path: 'admin-list',
            component: AdminListComponent
          },
          {
            path: 'myclass-report',
            component: MyClassReportComponent
          },
          {
            path: 'class-analysis',
            component: ClassAnalysisComponent
          },
          {
            path: 'sports-report',
            component: SportsReportComponent
          },
          {
            path: 'life-tracking',
            component: LifeTrackingV2Component
          },
          {
            path: 'cloudrun-report',
            component: CloudrunReportComponent
          },
        ]
      },
      {
        path: 'search-group',
        component: SearchGroupComponent
      },
      {
        path: 'mygroup-list-v2',
        component: MyGroupListComponent
      }
    ]
  },
  { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }

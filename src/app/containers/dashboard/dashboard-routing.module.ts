import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { EnrollFormComponent } from './components/enroll-form/enroll-form.component';
import { EventComponent } from './components/event/event.component';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { EditEventComponent } from './components/edit-event/edit-event.component';
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
import { EventManagementComponent } from './components/event-management/event-management.component';
import { AuthGuard } from '@shared/guards/auth/auth.guard';
import { MyGroupListComponent } from './group/my-group-list/my-group-list.component';
import { GroupSearchComponent } from './group/group-search/group-search.component';
import { GroupInfoComponent } from './group/group-info/group-info.component';
import { EditGroupInfoComponent } from './group/edit-group-info/edit-group-info.component';
import { AllGroupListComponent } from './group/all-group-list/all-group-list.component';
import { EditGroupGuard } from './guards/edit-group-guard';
import { CreateGroupComponent } from './group/create-group/create-group.component';
import { InnerSettingsComponent } from './components/inner-settings/inner-settings.component';
import { DashboardGuard } from './guards/dashboard-guard';
import { ActivityInfoComponent } from './components/activity-info/activity-info.component';
import { MyActivityComponent } from '@shared/components/my-activity/my-activity.component';
import { SportReportComponent } from './components/sport-report/sport-report.component';
import { MyDeviceComponent } from './components/device/my-device/my-device.component';
import { ProductInfoComponent } from './components/device/product-info/product-info.component';
import { TrainLiveComponent } from './components/train-live/train-live.component';
import { SettingsComponent } from './components/settings/settings.component';
import { PersonalPreferencesComponent } from './components/settings/personal-preferences/personal-preferences.component';

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
        path: 'event',
        component: EventComponent,
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
      // {
      //   path: 'my-group-list/create',
      //   component: CreateGroupComponent
      // },

      {
        path: 'group-search',
        component: GroupSearchComponent
      },
      {
        path: 'group-info/:groupId',
        component: GroupInfoComponent
      },
      {
        path: 'group-info/:groupId/edit',
        component: EditGroupInfoComponent,
        canActivate: [EditGroupGuard]
      },
      {
        path: 'group-info/:groupId/create',
        component: CreateGroupComponent,
        canActivate: [EditGroupGuard]
      },
      {
        path: 'system/event-management',
        component: EventManagementComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/event',
        component: EventComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/event/create',
        component: CreateEventComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'system/event/edit/:id',
        component: EditEventComponent,
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
        path: 'my-activity',
        component: MyActivityComponent
      },
      {
        path: 'my-activity/detail/:fileId',
        component: ActivityInfoComponent
      },
      {
        path: 'sport-report',
        component: SportReportComponent
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

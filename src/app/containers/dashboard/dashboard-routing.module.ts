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
import { CoachDashboardDetailComponent } from './components/coach-dashboard-detail/coach-dashboard-detail.component';
import { CoachRexComponent } from './components/coach-rex/coach-rex.component';
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
import { MyActivityComponent } from './components/my-activity/my-activity.component';

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
        path: 'event/create',
        component: CreateEventComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'event/edit/:id',
        component: EditEventComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'event-calendar',
        component: EventCalendarComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'enroll/:event_id/preview',
        component: EnrollPreviewComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'leaderboard-settings',
        component: LeaderboardSettingsComponent,
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
        path: 'device_log',
        component: DeviceLogComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'device_log/detail/:userId',
        component: DeviceLogDetailComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'coach-dashboard',
        component: CoachDashboardComponent
      },
      {
        path: 'coach-dashboard/detail/:raceId',
        component: CoachDashboardDetailComponent
      },
      {
        path: 'test/:raceId',
        component: CoachRexComponent
      },
      {
        path: 'event-management',
        component: EventManagementComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'my-group-list',
        component: MyGroupListComponent
      },
      {
        path: 'my-group-list/create',
        component: CreateGroupComponent
      },
      {
        path: 'all-group-list',
        component: AllGroupListComponent,
        canActivate: [DashboardGuard]
      },
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
        path: 'create-brand-group',
        component: CreateGroupComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'setting',
        component: InnerSettingsComponent,
        canActivate: [DashboardGuard]
      },
      {
        path: 'my-activity',
        component: MyActivityComponent
      },
      {
        path: 'my-activity/detail',
        component: ActivityInfoComponent
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

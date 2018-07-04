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

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'enroll/:event_id',
        component: EnrollFormComponent
      },
      {
        path: 'event',
        component: EventComponent
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
        component: CreateEventComponent
      },
      {
        path: 'event/edit/:id',
        component: EditEventComponent
      },
      {
        path: 'event-calendar',
        component: EventCalendarComponent
      },
      {
        path: 'enroll/:event_id/preview',
        component: EnrollPreviewComponent
      },
      {
        path: 'leaderboard-settings',
        component: LeaderboardSettingsComponent
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
        component: DeviceLogComponent
      },
      {
        path: 'device_log/detail/:userId',
        component: DeviceLogDetailComponent
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
        component: EventManagementComponent
      },
      {
        path: 'my-group-list',
        component: MyGroupListComponent
      },
      {
        path: 'all-group-list',
        component: AllGroupListComponent
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
        component: EditGroupInfoComponent
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

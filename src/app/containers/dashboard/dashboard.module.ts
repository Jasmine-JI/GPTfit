import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedComponentsModule } from '@shared/components/shared-components.module';
import { EnrollFormComponent } from './components/enroll-form/enroll-form.component';
import { FormsModule } from '@angular/forms';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { EventComponent } from './components/event/event.component';
import { EditEventComponent } from './components/edit-event/edit-event.component';
import { CertificatePreviewComponent } from './components/certificate-preview/certificate-preview.component';
import { CertificateComponent } from './components/certificate/certificate.component';
import { MyDatePickerModule } from 'mydatepicker';
import { EventEnrollService } from './services/event-enroll.service';
import { MapService } from '@shared/services/map.service';
import { EventCalendarComponent } from './components/event-calendar/event-calendar.component';
import { CustomMaterialModule } from '@shared/custom-material.module.ts';
import { EnrollPreviewComponent } from './components/enroll-preview/enroll-preview.component';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { EventInfoService } from './services/event-info.service';
import { GpxService } from './services/gpx.service';
import { MsgDialogComponent } from './components/msg-dialog/msg-dialog.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedPipes } from '@shared/pipes/shared-pipes';
import { LeaderboardSettingsComponent } from './components/leaderboard-settings/leaderboard-settings.component';
import { RealTimeLeaderboardComponent } from './components/real-time-leaderboard/real-time-leaderboard.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DbMaintainComponent } from './components/db-maintain/db-maintain.component';
import { DbResultDialogComponent } from './components/db-result-dialog/db-result-dialog.component';
import { DeviceLogComponent } from './components/device-log/device-log.component';
import { DeviceLogService } from './services/device-log.service';
import { DeviceLogDetailComponent } from './components/device-log-detail/device-log-detail.component';
import { CoachDashboardComponent } from './components/coach-dashboard/coach-dashboard.component';
import { CoachService } from './services/coach.service';
import { HrZoneDialogComponent } from './components/hr-zone-dialog/hr-zone-dialog.component';
import { DragulaModule } from 'ng2-dragula/ng2-dragula';
import { CoachDashboardDetailComponent } from './components/coach-dashboard-detail/coach-dashboard-detail.component';
import { Top3DialogComponent } from './components/top3-dialog/top3-dialog.component';
import { CoachRexComponent } from './components/coach-rex/coach-rex.component';
import { EventManagementComponent } from './components/event-management/event-management.component';
import { UserInfoService } from './services/userInfo.service';
import { UtilsService } from '@shared/services/utils.service';
import { SharedModule } from '@shared/shared.module';
import { MyGroupListComponent } from './components/my-group-list/my-group-list.component';
import { AllGroupListComponent } from './components/all-group-list/all-group-list.component';
import { GroupSearchComponent } from './components/group-search/group-search.component';
import { GroupInfoComponent } from './components/group-info/group-info.component';
import { GroupService } from './services/group.service';
import { AccessNamePipe } from './pipes/access-name.pipe';
import { GroupStatusPipe } from './pipes/group-status.pipe';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedComponentsModule,
    FormsModule,
    MyDatePickerModule,
    CustomMaterialModule,
    MyDatePickerModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedPipes,
    ReactiveFormsModule,
    DragulaModule,
    SharedModule
  ],
  providers: [
    EventEnrollService,
    MapService,
    GlobalEventsManager,
    EventInfoService,
    GpxService,
    DeviceLogService,
    CoachService,
    UserInfoService,
    UtilsService,
    GroupService
  ],
  declarations: [
    DashboardComponent,
    EnrollFormComponent,
    CreateEventComponent,
    EventComponent,
    EditEventComponent,
    CertificatePreviewComponent,
    CertificateComponent,
    EventCalendarComponent,
    EnrollPreviewComponent,
    MsgDialogComponent,
    LeaderboardSettingsComponent,
    RealTimeLeaderboardComponent,
    DbMaintainComponent,
    DbResultDialogComponent,
    DeviceLogComponent,
    DeviceLogDetailComponent,
    CoachDashboardComponent,
    HrZoneDialogComponent,
    CoachDashboardDetailComponent,
    Top3DialogComponent,
    CoachRexComponent,
    EventManagementComponent,
    MyGroupListComponent,
    AllGroupListComponent,
    GroupSearchComponent,
    GroupInfoComponent,
    AccessNamePipe,
    GroupStatusPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    MsgDialogComponent,
    DbResultDialogComponent,
    HrZoneDialogComponent,
    Top3DialogComponent
  ]
})
export class DashboardModule {}

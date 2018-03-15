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
    ReactiveFormsModule
  ],
  providers: [
    EventEnrollService,
    GlobalEventsManager,
    EventInfoService,
    GpxService,
    DeviceLogService,
    CoachService
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
    HrZoneDialogComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    MsgDialogComponent,
    DbResultDialogComponent,
    HrZoneDialogComponent
  ]
})
export class DashboardModule {}

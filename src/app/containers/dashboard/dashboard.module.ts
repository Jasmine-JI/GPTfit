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
import { CoachDashboardDetailComponent } from './components/coach-dashboard-detail/coach-dashboard-detail.component';
import { Top3DialogComponent } from './components/top3-dialog/top3-dialog.component';
import { CoachRexComponent } from './components/coach-rex/coach-rex.component';
import { EventManagementComponent } from './components/event-management/event-management.component';
import { UserInfoService } from './services/userInfo.service';
import { UtilsService } from '@shared/services/utils.service';
import { SharedModule } from '@shared/shared.module';
import { MyGroupListComponent } from './group/my-group-list/my-group-list.component';
import { AllGroupListComponent } from './group/all-group-list/all-group-list.component';
import { GroupSearchComponent } from './group/group-search/group-search.component';
import { GroupInfoComponent } from './group/group-info/group-info.component';
import { GroupService } from './services/group.service';
import { AccessNamePipe } from './pipes/access-name.pipe';
import { GroupStatusPipe } from './pipes/group-status.pipe';
import { EditGroupInfoComponent } from './group/edit-group-info/edit-group-info.component';
import { EditGroupGuard } from './guards/edit-group-guard';
import { CreateGroupComponent } from './group/create-group/create-group.component';
import { RightSettingWinComponent } from './group/right-setting-win/right-setting-win.component';
import { GroupLevelNamePipe } from './pipes/group-level-name.pipe';
import { InnerSettingsComponent } from './components/inner-settings/inner-settings.component';
import { PeopleSelectorWinComponent } from './components/people-selector-win/people-selector-win.component';
import { DashboardGuard } from './guards/dashboard-guard';
import { ActivityInfoComponent } from './components/activity-info/activity-info.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { ActivityService } from './services/activity.service';
import { MyActivityComponent } from './components/my-activity/my-activity.component';
import { SportTypePipe } from './pipes/sport-type.pipe';
import { SportDatePipe } from './pipes/sport-date.pipe';
import { NgProgressModule } from '@ngx-progressbar/core';
import { SportReportComponent } from './components/sport-report/sport-report.component';
import { ActivityLevelsComponent } from './components/sport-report/components/activity-levels/activity-levels.component';
import { AllDurationComponent } from './components/sport-report/components/all-duration/all-duration.component';
import { TotalDistanceComponent } from './components/sport-report/components/total-distance/total-distance.component';
import { BurnCaloriesComponent } from './components/sport-report/components/burn-calories/burn-calories.component';
import { AverageSpeedComponent } from './components/sport-report/components/average-speed/average-speed.component';
import { MaxSpeedComponent } from './components/sport-report/components/max-speed/max-speed.component';
import { AverageHRComponent } from './components/sport-report/components/average-hr/average-hr.component';
import { MaxHRComponent } from './components/sport-report/components/max-hr/max-hr.component';
import { OtherBurnCaloriesComponent } from './components/sport-report/components/other-burn-calories/other-burn-calories.component';
import { AllTimesComponent } from './components/sport-report/components/all-times/all-times.component';
import { AllGroupsComponent } from './components/sport-report/components/all-groups/all-groups.component';
import { PartialMuscleInfoComponent } from './components/sport-report/components/partial-muscle-info/partial-muscle-info.component';
import { MyDeviceComponent } from './components/device/my-device/my-device.component';
import { ProductInfoComponent } from './components/device/product-info/product-info.component';

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
    SharedModule,
    NgxEchartsModule,
    NgProgressModule
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
    GroupService,
    EditGroupGuard,
    DashboardGuard,
    ActivityService
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
    GroupStatusPipe,
    EditGroupInfoComponent,
    CreateGroupComponent,
    RightSettingWinComponent,
    GroupLevelNamePipe,
    InnerSettingsComponent,
    PeopleSelectorWinComponent,
    ActivityInfoComponent,
    MyActivityComponent,
    SportTypePipe,
    SportDatePipe,
    SportReportComponent,
    ActivityLevelsComponent,
    AllDurationComponent,
    TotalDistanceComponent,
    BurnCaloriesComponent,
    AverageSpeedComponent,
    MaxSpeedComponent,
    AverageHRComponent,
    MaxHRComponent,
    OtherBurnCaloriesComponent,
    AllTimesComponent,
    AllGroupsComponent,
    PartialMuscleInfoComponent,
    MyDeviceComponent,
    ProductInfoComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    MsgDialogComponent,
    DbResultDialogComponent,
    HrZoneDialogComponent,
    Top3DialogComponent,
    RightSettingWinComponent,
    PeopleSelectorWinComponent,
    SportReportComponent
  ]
})
export class DashboardModule {}

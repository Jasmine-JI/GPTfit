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
import { Top3DialogComponent } from './components/top3-dialog/top3-dialog.component';
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
import { EditGroupInfoComponent } from './group/edit-group-info/edit-group-info.component';
import { EditGroupGuard } from './guards/edit-group-guard';
import { CreateGroupComponent } from './group/create-group/create-group.component';
import { RightSettingWinComponent } from './group/right-setting-win/right-setting-win.component';
import { InnerSettingsComponent } from './components/inner-settings/inner-settings.component';
import { PeopleSelectorWinComponent } from './components/people-selector-win/people-selector-win.component';
import { DashboardGuard } from './guards/dashboard-guard';
import { ActivityInfoComponent } from './components/activity-info/activity-info.component';
import { ActivityService } from './services/activity.service';
import { MyActivityComponent } from './components/my-activity/my-activity.component';
import { SportTypePipe } from './pipes/sport-type.pipe';
import { SportDatePipe } from './pipes/sport-date.pipe';
import { SportTimePipe } from './pipes/sport-time.pipe';
import { SportPacePipe } from './pipes/sport-pace.pipe';
import { NgProgressModule } from '@ngx-progressbar/core';
import { SportReportComponent } from './components/sport-report/sport-report.component';
import { ActivityLevelsComponent } from './components/sport-report/components/activity-levels/activity-levels.component';
import { AllDurationComponent } from './components/sport-report/components/all-duration/all-duration.component';
import { ColumnstackedChartComponent } from './components/sport-report/components/column-stacked-chart/column-stacked-chart.component';
import { BurnCaloriesComponent } from './components/sport-report/components/burn-calories/burn-calories.component';
import { ScatterChartComponent } from './components/sport-report/components/scatter-chart/scatter-chart.component';
import { OtherBurnCaloriesComponent } from './components/sport-report/components/other-burn-calories/other-burn-calories.component';
import { AllTimesComponent } from './components/sport-report/components/all-times/all-times.component';
import { AllGroupsComponent } from './components/sport-report/components/all-groups/all-groups.component';
import { PartialMuscleInfoComponent } from './components/sport-report/components/partial-muscle-info/partial-muscle-info.component';
import { MyDeviceComponent } from './components/device/my-device/my-device.component';
import { ProductInfoComponent } from './components/device/product-info/product-info.component';
import { TodayLoginnerWinComponent } from './components/today-loginner-win/today-loginner-win.component';
import { ReportService } from './services/report.service';
import { TrainLiveComponent } from './components/train-live/train-live.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from '@shared/interceptors/token.interceptor';
import { BottomSheetComponent } from './group/edit-group-info/edit-group-info.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UserSettingsComponent } from './components/settings/user-settings/user-settings.component';
import { PrivacySettingsComponent } from './components/settings/privacy-settings/privacy-settings.component';
import { AccountInfoComponent } from './components/settings/account-info/account-info.component';

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
    ActivityService,
    ReportService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
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
    Top3DialogComponent,
    EventManagementComponent,
    MyGroupListComponent,
    AllGroupListComponent,
    GroupSearchComponent,
    GroupInfoComponent,
    AccessNamePipe,
    EditGroupInfoComponent,
    CreateGroupComponent,
    RightSettingWinComponent,
    InnerSettingsComponent,
    PeopleSelectorWinComponent,
    ActivityInfoComponent,
    MyActivityComponent,
    SportTypePipe,
    SportDatePipe,
    SportTimePipe,
    SportPacePipe,
    SportReportComponent,
    ActivityLevelsComponent,
    AllDurationComponent,
    ColumnstackedChartComponent,
    BurnCaloriesComponent,
    ScatterChartComponent,
    OtherBurnCaloriesComponent,
    AllTimesComponent,
    AllGroupsComponent,
    PartialMuscleInfoComponent,
    MyDeviceComponent,
    ProductInfoComponent,
    TodayLoginnerWinComponent,
    TrainLiveComponent,
    BottomSheetComponent,
    SettingsComponent,
    UserSettingsComponent,
    PrivacySettingsComponent,
    AccountInfoComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    MsgDialogComponent,
    DbResultDialogComponent,
    HrZoneDialogComponent,
    Top3DialogComponent,
    RightSettingWinComponent,
    PeopleSelectorWinComponent,
    SportReportComponent,
    TodayLoginnerWinComponent,
    BottomSheetComponent
  ]
})
export class DashboardModule {}

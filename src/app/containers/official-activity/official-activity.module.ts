import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { OfficialActivityRoutingModule } from './official-activity-routing.module';
import { OfficialActivityComponent } from './official-activity.component';
import { ActivityListComponent } from './components/activity-list/activity-list.component';
import { ActivityDetailComponent } from './components/activity-detail/activity-detail.component';
import { ApplyActivityComponent } from './components/apply-activity/apply-activity.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { ContestantListComponent } from './components/contestant-list/contestant-list.component';
import { EditActivityComponent } from './components/edit-activity/edit-activity.component';
import { EditGuard } from './guards/edit.guard';
import { AdminGuard } from './guards/admin.guard';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { CustomMaterialModule } from '../../core/custom-material.module';
import { SharedModule } from '../../shared/shared.module';
import { NgProgressModule } from '@ngx-progressbar/core';
import { OfficialActivityService } from './services/official-activity.service';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { EditCarouselComponent } from './components/edit-carousel/edit-carousel.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { AboutCloudrunComponent } from './components/about-cloudrun/about-cloudrun.component';
import {
  SexPipe,
  SafeHtmlPipe,
  LineBreakPipe,
  GroupStatusPipe,
  GroupLevelNamePipe,
  SportTimePipe,
  MuscleNamePipe,
  SlicePipe,
  RelativeDayPipe,
  TimeFormatPipe,
  RegionCodePipe,
  LanguageCodePipe,
  AppIdPipe,
  SystemIdPipe,
  SportTypePipe,
  LongTextPipe,
  GroupIdSlicePipe,
  ThousandConversionPipe,
  SpeedSibsPipe,
  TemperatureSibsPipe,
  swimPosture,
  DataTypeTranslatePipe,
  DataTypeUnitPipe,
  PaiPipe,
  FindPreferPipe,
  MuscleGroupIconPipe,
  PythagoreanPipe,
  MathAbsPipe,
  BodyHeightSibsPipe,
  BMIPipe,
  BodyAssessmentPipe,
  FFMIPipe,
  DataFlowConversionPipe,
  LengthSibsPipe,
  SafeStylePipe,
  PatchUnitPipe,
  AgePipe,
  RankSuffixPipe,
  TargetFieldNamePipe,
  TargetFieldUnitPipe,
  MuscleGroupNamePipe,
  MusclePartIconPipe,
  PaidStatusPipe,
  ShippedStatusPipe,
  ListStatusPipe,
} from '../../core/pipes';
import { StationMailModule } from '../station-mail/station-mail.module';

@NgModule({
  imports: [
    OfficialActivityRoutingModule,
    CommonModule,
    SharedComponentsModule,
    CustomMaterialModule,
    SharedModule,
    NgProgressModule,
    CKEditorModule,
    FormsModule,
    QRCodeModule,
    StationMailModule,
    SexPipe,
    SafeHtmlPipe,
    LineBreakPipe,
    GroupStatusPipe,
    GroupLevelNamePipe,
    SportTimePipe,
    MuscleNamePipe,
    SlicePipe,
    RelativeDayPipe,
    TimeFormatPipe,
    RegionCodePipe,
    LanguageCodePipe,
    AppIdPipe,
    SystemIdPipe,
    SportTypePipe,
    LongTextPipe,
    GroupIdSlicePipe,
    ThousandConversionPipe,
    SpeedSibsPipe,
    TemperatureSibsPipe,
    swimPosture,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    PaiPipe,
    FindPreferPipe,
    MuscleGroupIconPipe,
    PythagoreanPipe,
    MathAbsPipe,
    BodyHeightSibsPipe,
    BMIPipe,
    BodyAssessmentPipe,
    FFMIPipe,
    DataFlowConversionPipe,
    LengthSibsPipe,
    SafeStylePipe,
    PatchUnitPipe,
    AgePipe,
    RankSuffixPipe,
    TargetFieldNamePipe,
    TargetFieldUnitPipe,
    MuscleGroupNamePipe,
    MusclePartIconPipe,
    ListStatusPipe,
    PaidStatusPipe,
    ShippedStatusPipe,
  ],
  declarations: [
    OfficialActivityComponent,
    ActivityListComponent,
    ActivityDetailComponent,
    ApplyActivityComponent,
    LeaderboardComponent,
    ContestantListComponent,
    EditActivityComponent,
    EditCarouselComponent,
    ContactUsComponent,
    AboutCloudrunComponent,
  ],
  providers: [EditGuard, OfficialActivityService, PaidStatusPipe, ShippedStatusPipe, AdminGuard],
})
export class OfficialActivityModule {}

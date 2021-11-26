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
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { SharedPipes } from '../../shared/pipes/shared-pipes';
import { CustomMaterialModule } from '../../shared/custom-material.module';
import { SharedModule } from '../../shared/shared.module';
import { NgProgressModule } from '@ngx-progressbar/core';
import { OfficialActivityService } from './services/official-activity.service';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../dashboard/services/group.service';
import { UserInfoService } from '../dashboard/services/userInfo.service';
import { PaidStatusPipe } from './pipes/paid-status.pipe';
import { ShippedStatusPipe } from './pipes/shipped-status.pipe';


@NgModule({
  imports: [
    OfficialActivityRoutingModule,
    CommonModule,
    SharedComponentsModule,
    CustomMaterialModule,
    SharedPipes,
    SharedModule,
    NgProgressModule,
    CKEditorModule,
    FormsModule
  ],
  declarations: [
    OfficialActivityComponent,
    ActivityListComponent,
    ActivityDetailComponent,
    ApplyActivityComponent,
    LeaderboardComponent,
    ContestantListComponent,
    EditActivityComponent,
    PaidStatusPipe,
    ShippedStatusPipe
  ],
  providers: [
    EditGuard,
    OfficialActivityService,
    GroupService,
    UserInfoService
  ]

})
export class OfficialActivityModule { }

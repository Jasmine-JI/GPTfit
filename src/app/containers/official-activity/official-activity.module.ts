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
import { SharedPipes } from '../../shared/pipes/shared-pipes';
import { CustomMaterialModule } from '../../shared/custom-material.module';
import { SharedModule } from '../../shared/shared.module';
import { NgProgressModule } from '@ngx-progressbar/core';
import { OfficialActivityService } from './services/official-activity.service';
import { FormsModule } from '@angular/forms';
import { PaidStatusPipe } from './pipes/paid-status.pipe';
import { ShippedStatusPipe } from './pipes/shipped-status.pipe';
import { QRCodeModule } from 'angularx-qrcode';
import { EditCarouselComponent } from './components/edit-carousel/edit-carousel.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { GroupService } from '../../shared/services/group.service';
import { ListStatusPipe } from './pipes/list-status.pipe';
import { AboutCloudrunComponent } from './components/about-cloudrun/about-cloudrun.component';


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
    FormsModule,
    QRCodeModule
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
    ShippedStatusPipe,
    EditCarouselComponent,
    ContactUsComponent,
    ListStatusPipe,
    AboutCloudrunComponent
  ],
  providers: [
    EditGuard,
    OfficialActivityService,
    PaidStatusPipe,
    ShippedStatusPipe,
    AdminGuard,
    GroupService
  ]

})
export class OfficialActivityModule { }

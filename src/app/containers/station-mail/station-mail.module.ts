import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StationMailComponent } from './station-mail.component';
import { CreateMailComponent } from './create-mail/create-mail.component';
import { InboxComponent } from './inbox/inbox.component';
import { ReceiverListComponent } from './receiver-list/receiver-list.component';
import { MailDetailComponent } from './mail-detail/mail-detail.component';
import { StationMailRoutingModule } from './station-mail-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { SharedPipes } from '../../shared/pipes/shared-pipes';
import { CustomMaterialModule } from '../../shared/custom-material.module';

@NgModule({
  imports: [
    StationMailRoutingModule,
    CommonModule,
    SharedModule,
    SharedPipes,
    CustomMaterialModule,
  ],
  declarations: [
    StationMailComponent,
    CreateMailComponent,
    InboxComponent,
    ReceiverListComponent,
    MailDetailComponent,
  ],
  exports: [InboxComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StationMailModule {}

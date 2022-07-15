import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StationMailComponent } from './station-mail.component';
import { Page404Component } from '../../shared/components/page404/page404.component';
import { AuthGuard } from '../../shared/guards/auth/auth.guard';
import { appPath } from '../../app-path.const';
import { CreateMailComponent } from './create-mail/create-mail.component';
import { InboxComponent } from './inbox/inbox.component';
import { MailDetailComponent } from './mail-detail/mail-detail.component';
import { ReceiverListComponent } from './receiver-list/receiver-list.component';


const routes: Routes = [
  {
    path: '',
    component: StationMailComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: appPath.stationMail.newMail,
        component: CreateMailComponent
      },
      {
        path: appPath.stationMail.mailDetail,
        component: MailDetailComponent
      },
      {
        path: appPath.stationMail.inbox,
        component: InboxComponent
      },
      {
        path: appPath.stationMail.receiverList,
        component: ReceiverListComponent
      },
      {
        path: '',
        redirectTo: appPath.stationMail.inbox
      }
    ]
  },
  {
    path: appPath.pageNotFound,
    component: Page404Component
  },
  {
    path: '**',
    redirectTo: appPath.pageNotFound
  }
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StationMailRoutingModule { }

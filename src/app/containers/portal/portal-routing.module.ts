import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PortalComponent } from './portal.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { MapInfoComponent } from './components/map-info/map-info.component';
import { PasswordComponent } from './components/password/password.component';
import { DemoQrcodComponent } from './components/demo-qrcod/demo-qrcod.component';
import { SigninComponent } from './components/signin/signin.component';
import { SigninGuard } from '@shared/guards/signin/signin.guard';
import { SignupComponent } from './components/signup/signup.component';
import { ForgetpwdComponent } from './components/forgetpwd/forgetpwd.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { GroupInfoComponent } from './components/group-info/group-info.component';
import { FirstLoginComponent } from './components/first-login/first-login.component';
import { BasicInfoComponent } from './components/user-profile/basic-info/basic-info.component';
import { ActivityRecordComponent } from './components/user-profile/activity-record/activity-record.component';
import { SportReportComponent } from './components/user-profile/sport-report/sport-report.component';
import { ActivityInfoComponent } from '@shared/components/activity-info/activity-info.component';

const routes: Routes = [
  {
    path: '',
    component: PortalComponent,
    children: [
      {
        path: 'resetpassword',
        component: PasswordComponent
      },
      {
        path: 'leaderboard',
        component: LeaderboardComponent
      },
      {
        path: 'leaderboard/mapInfo',
        component: MapInfoComponent
      },
      {
        path: 'pair',
        component: DemoQrcodComponent
      },
      {
        path: 'signin',
        component: SigninComponent,
        canActivate: [SigninGuard]
      },
      {
        path: 'signup',
        component: SignupComponent
      },
      {
        path: 'forget-pwd',
        component: ForgetpwdComponent
      },
      {
        path: 'user-profile/:userId',
        component: UserProfileComponent,
        children: [
          {
            path: 'activity/:id',
            component: ActivityRecordComponent
          }
        ]
      },
      {
        path: 'activity/:fileId',
        component: UserProfileComponent,
        children: [
          {
            path: '',
            component: ActivityInfoComponent
          }
        ]
      },
      {
        path: 'user-profile/:userId',
        component: UserProfileComponent,
        children: [
          {
            path: 'activity-list',
            component: ActivityRecordComponent
          },
          {
            path: 'sport-report',
            component: SportReportComponent
          }
        ]
      },
      {
        path: 'group-info/:groupId',
        component: GroupInfoComponent
      },
      {
        path: 'first-login',
        component: FirstLoginComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PortalRoutingModule { }

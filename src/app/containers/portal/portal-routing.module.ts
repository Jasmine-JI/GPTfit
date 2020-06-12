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
import { PortalGroupInfoComponent } from './components/portal-group-info/portal-group-info.component';
import { FirstLoginComponent } from './components/first-login/first-login.component';
import { SportReportComponent } from '@shared/components/sport-report/sport-report.component';
import { ActivityInfoComponent } from '@shared/components/activity-info/activity-info.component';
import { MyActivityComponent } from '@shared/components/my-activity/my-activity.component';
import { ApplicationComponent } from './components/application/application.component';
import { Page404Component } from '../../shared/components/page404/page404.component';
import { Page403Component } from '../../shared/components/page403/page403.component';
import { QrcodeUploadComponent } from '../dashboard/components/qrcode-upload/qrcode-upload.component';
import { AppSignupComponent } from './components/app-sign/app-signup/app-signup.component';
import { AppSigninComponent } from './components/app-sign/app-signin/app-signin.component';
import { AppEnableComponent } from './components/app-sign/app-enable/app-enable.component';
import { AppForgetpwComponent } from './components/app-sign/app-forgetpw/app-forgetpw.component';
import { AppModifypwComponent } from './components/app-sign/app-modifypw/app-modifypw.component';
import { AppChangeAccountComponent } from './components/app-sign/app-change-account/app-change-account.component';
import { AppQrcodeLoginComponent } from './components/app-sign/app-qrcode-login/app-qrcode-login.component';
import { AppFirstLoginComponent } from './components/app-sign/app-first-login/app-first-login.component';

const routes: Routes = [
  {
    path: '',
    component: PortalComponent,
    children: [
      {
        path: 'application',
        component: ApplicationComponent,
      },
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
        path: 'activity/:fileId',
        component: ActivityInfoComponent
      },
      {
        path: 'user-profile/:userId',
        component: UserProfileComponent,
        children: [
          {
            path: 'activity-list',
            component: MyActivityComponent
          },
          {
            path: 'sport-report',
            component: SportReportComponent
          }
        ]
      },
      {
        path: 'group-info/:groupId',
        component: PortalGroupInfoComponent
      },
      {
        path: 'first-login',
        component: FirstLoginComponent
      },
      {
        path: 'qrupload/activityfile',
        component: QrcodeUploadComponent
      },
      {
        path: 'register',
        component: AppSignupComponent
      },
      {
        path: 'signIn',
        component: AppSigninComponent,
        canActivate: [SigninGuard]
      },
      {
        path: 'enableAccount',
        component: AppEnableComponent
      },
      {
        path: 'resetPassword',
        component: AppForgetpwComponent
      },
      {
        path: 'editPassword',
        component: AppModifypwComponent
      },
      {
        path: 'changeAccount',
        component: AppChangeAccountComponent
      },
      {
        path: 'qrSignIn',
        component: AppQrcodeLoginComponent
      },
      {
        path: 'signInQrcode',
        component: AppQrcodeLoginComponent
      },
      {
        path: 'firstLogin',
        component: AppFirstLoginComponent
      },
      {
        path: 'register-web',
        component: AppSignupComponent
      },
      {
        path: 'signIn-web',
        component: AppSigninComponent,
        canActivate: [SigninGuard]
      },
      {
        path: 'enableAccount-web',
        component: AppEnableComponent
      },
      {
        path: 'resetPassword-web',
        component: AppForgetpwComponent
      },
      {
        path: 'editPassword-web',
        component: AppModifypwComponent
      },
      {
        path: 'changeAccount-web',
        component: AppChangeAccountComponent
      },
      {
        path: 'signInQrcode-web',
        component: AppQrcodeLoginComponent
      },
      {
        path: 'firstLogin-web',
        component: AppFirstLoginComponent
      },
      { path: '404', component: Page404Component },
      { path: '403', component: Page403Component }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PortalRoutingModule { }

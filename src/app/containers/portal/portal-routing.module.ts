import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PortalComponent } from './portal.component';
import { DemoQrcodComponent } from './components/demo-qrcod/demo-qrcod.component';
import { SigninGuard } from '../../shared/guards/signin/signin.guard';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { SportsReportComponent } from '../../shared/components/sports-report/sports-report.component';
import { MyActivityComponent } from '../../shared/components/my-activity/my-activity.component';
import { Page404Component } from '../../shared/components/page404/page404.component';
import { Page403Component } from '../../shared/components/page403/page403.component';
import { QrcodeUploadComponent } from '../dashboard/components/qrcode-upload/qrcode-upload.component';
import { OfficialActivityComponent } from './components/official-activity/official-activity.component';
import { AppSignupComponent } from './components/app-sign/app-signup/app-signup.component';
import { AppSigninComponent } from './components/app-sign/app-signin/app-signin.component';
import { AppEnableComponent } from './components/app-sign/app-enable/app-enable.component';
import { AppForgetpwComponent } from './components/app-sign/app-forgetpw/app-forgetpw.component';
import { AppModifypwComponent } from './components/app-sign/app-modifypw/app-modifypw.component';
import { AppChangeAccountComponent } from './components/app-sign/app-change-account/app-change-account.component';
import { AppQrcodeLoginComponent } from './components/app-sign/app-qrcode-login/app-qrcode-login.component';
import { AppFirstLoginComponent } from './components/app-sign/app-first-login/app-first-login.component';
import { GroupInfoComponent } from '../dashboard/group-v2/group-info/group-info.component';
import { GroupIntroductionComponent } from '../../containers/dashboard/group-v2/group-info/group-introduction/group-introduction.component';
import { AppCompressDataComponent } from './components/app-sign/app-compress-data/app-compress-data.component';
import { AppDestroyAccountComponent } from './components/app-sign/app-destroy-account/app-destroy-account.component';
import { ActivityDetailComponent } from '../../shared/components/activity-detail/activity-detail.component';
import { DeviceInfoComponent } from '../dashboard/components/device-info/device-info.component';


const routes: Routes = [
  {
    path: 'introduction/system',
    component: PortalComponent,
  },
  {
    path: 'introduction/application',
    component: PortalComponent,
  },
  {
    path: 'introduction/analysis',
    component: PortalComponent,
  },
  {
    path: '',
    component: PortalComponent,
    children: [
      /*
      {
        path: 'pair',
        component: DemoQrcodComponent
      },
      */
      {
        path: 'pair',
        component: DeviceInfoComponent
      },
      {
        path: 'activity/:fileId',
        component: ActivityDetailComponent
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
            component: SportsReportComponent
          }
        ]
      },
      {
        path: 'group-info/:groupId',
        component: GroupInfoComponent,
        children: [
          {
            path: 'group-introduction',
            component: GroupIntroductionComponent
          }
        ]
      },
      {
        path: 'first-login',
        component: AppFirstLoginComponent
      },
      {
        path: 'qrupload/activityfile',
        component: QrcodeUploadComponent
      },
      {
        path: 'signin',
        component: AppSigninComponent,
        canActivate: [SigninGuard]
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
        path: 'compressData',
        component: AppCompressDataComponent
        
      },
      {
        path: 'destroyAccount',
        component: AppDestroyAccountComponent
        
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
      {
        path: 'official-activity',
        component: OfficialActivityComponent
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

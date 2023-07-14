import { IntroductionComponent } from './components/introduction/introduction.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PortalComponent } from './portal.component';
import { SigninGuard } from '../../core/guard/signin/signin.guard';
import { SportsReportComponent } from '../../shared/components/sports-report/sports-report.component';
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
import { GroupInfoComponent } from '../dashboard/group-v2/group-info/group-info.component';
import { GroupIntroductionComponent } from '../../containers/dashboard/group-v2/group-info/group-introduction/group-introduction.component';
import { AppCompressDataComponent } from './components/app-sign/app-compress-data/app-compress-data.component';
import { AppDestroyAccountComponent } from './components/app-sign/app-destroy-account/app-destroy-account.component';
import { ActivityDetailComponent } from '../../shared/components/activity-detail/activity-detail.component';
import { DeviceInfoComponent } from '../dashboard/components/device-info/device-info.component';
import { PersonalComponent } from '../dashboard/personal/personal.component';
import { ActivityListComponent } from '../dashboard/personal/activity-list/activity-list.component';
import { InfoComponent } from '../dashboard/personal/info/info.component';
import { MyLifeTrackingComponent } from '../../shared/components/my-life-tracking/my-life-tracking.component';
import { CloudrunReportComponent as PersonCloudrunReport } from '../dashboard/components/cloudrun-report/cloudrun-report.component';
import { SportsDetailComponent } from '../personal';
import { appPath } from '../../app-path.const';

const { portal, personal, professional, device, qrcodeUploadData, pageNoPermission, pageNotFound } =
  appPath;

const routes: Routes = [
  {
    path: '',
    component: IntroductionComponent,
  },
  {
    path: device.pair,
    component: DeviceInfoComponent,
  },
  {
    path: `${personal.activityDetail}/:${personal.fileId}`,
    component: ActivityDetailComponent,
    // component: SportsDetailComponent,
  },

  {
    path: `${personal.home}/:${personal.userId}`,
    component: PersonalComponent,
    children: [
      {
        path: personal.activityList,
        component: ActivityListComponent,
      },
      {
        path: personal.sportsReport,
        component: SportsReportComponent,
      },
      {
        path: personal.lifeTracking,
        component: MyLifeTrackingComponent,
      },
      {
        path: personal.cloudrun,
        component: PersonCloudrunReport,
      },
      {
        path: personal.info,
        component: InfoComponent,
      },
      {
        path: '',
        component: ActivityListComponent,
      },
    ],
  },
  {
    path: `${professional.groupDetail.home}/:${professional.groupId}`,
    component: GroupInfoComponent,
    children: [
      {
        path: professional.groupDetail.introduction,
        component: GroupIntroductionComponent,
      },
    ],
  },
  {
    path: qrcodeUploadData,
    component: QrcodeUploadComponent,
  },
  {
    path: portal.register,
    component: AppSignupComponent,
  },
  {
    path: portal.signIn,
    component: AppSigninComponent,
    canActivate: [SigninGuard],
  },
  {
    path: portal.enableAccount,
    component: AppEnableComponent,
  },
  {
    path: portal.resetPassword,
    component: AppForgetpwComponent,
  },
  {
    path: portal.editPassword,
    component: AppModifypwComponent,
  },
  {
    path: portal.changeAccount,
    component: AppChangeAccountComponent,
  },
  {
    path: portal.signInQrcode,
    component: AppQrcodeLoginComponent,
  },
  {
    path: portal.firstLogin,
    component: AppFirstLoginComponent,
  },
  {
    path: portal.compressData,
    component: AppCompressDataComponent,
  },
  {
    path: portal.destroyAccount,
    component: AppDestroyAccountComponent,
  },
  {
    path: portal.registerWeb,
    component: AppSignupComponent,
  },
  {
    path: portal.signInWeb,
    component: AppSigninComponent,
    canActivate: [SigninGuard],
  },
  {
    path: portal.enableAccountWeb,
    component: AppEnableComponent,
  },
  {
    path: portal.resetPasswordWeb,
    component: AppForgetpwComponent,
  },
  {
    path: portal.editPasswordWeb,
    component: AppModifypwComponent,
  },
  {
    path: portal.changeAccountWeb,
    component: AppChangeAccountComponent,
  },
  {
    path: portal.signInQrcodeWeb,
    component: AppQrcodeLoginComponent,
  },
  {
    path: portal.firstLoginWeb,
    component: AppFirstLoginComponent,
  },
  {
    path: pageNotFound,
    component: Page404Component,
  },
  {
    path: pageNoPermission,
    component: Page403Component,
  },
  {
    path: '**',
    redirectTo: pageNotFound,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PortalRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OfficialActivityComponent } from './official-activity.component';
import { ActivityListComponent } from './components/activity-list/activity-list.component';
import { ActivityDetailComponent } from './components/activity-detail/activity-detail.component';
import { ApplyActivityComponent } from './components/apply-activity/apply-activity.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { ContestantListComponent } from './components/contestant-list/contestant-list.component';
import { EditActivityComponent } from './components/edit-activity/edit-activity.component';
import { EditGuard } from './guards/edit.guard';
import { AdminGuard } from './guards/admin.guard';
import { Page404Component } from '../../shared/components/page404/page404.component';
import { Page403Component } from '../../shared/components/page403/page403.component';
import { EditCarouselComponent } from './components/edit-carousel/edit-carousel.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { AboutCloudrunComponent } from './components/about-cloudrun/about-cloudrun.component';
import { appPath } from '../../app-path.const';

const { officialActivity, pageNoPermission, pageNotFound } = appPath;
const officialActivityNotFound = `/${officialActivity.home}/${pageNotFound}`;

const routes: Routes = [
  {
    path: '',
    component: OfficialActivityComponent,
    children: [
      {
        path: officialActivity.activityList,
        component: ActivityListComponent,
      },
      {
        path: officialActivity.myActivity,
        component: ActivityListComponent,
      },
      {
        path: officialActivity.activityDetail,
        children: [
          {
            path: `:${officialActivity.eventId}`,
            component: ActivityDetailComponent,
          },
          {
            path: '',
            redirectTo: officialActivityNotFound,
            pathMatch: 'full',
          },
        ],
      },
      {
        path: officialActivity.applyActivity,
        children: [
          {
            path: `:${officialActivity.eventId}`,
            component: ApplyActivityComponent,
          },
          {
            path: '',
            redirectTo: officialActivityNotFound,
            pathMatch: 'full',
          },
        ],
      },
      {
        path: officialActivity.leaderboard,
        component: LeaderboardComponent,
      },
      {
        path: officialActivity.contestantList,
        children: [
          {
            path: `:${officialActivity.eventId}`,
            component: ContestantListComponent,
            canActivate: [AdminGuard],
          },
          {
            path: '',
            redirectTo: officialActivityNotFound,
            pathMatch: 'full',
          },
        ],
      },
      {
        path: officialActivity.editActivity,
        children: [
          {
            path: `:${officialActivity.eventId}`,
            component: EditActivityComponent,
            canActivate: [AdminGuard],
            canDeactivate: [EditGuard],
          },
          {
            path: '',
            redirectTo: officialActivityNotFound,
            pathMatch: 'full',
          },
        ],
      },
      {
        path: officialActivity.aboutCloudrun,
        component: AboutCloudrunComponent,
      },
      {
        path: officialActivity.contactUs,
        component: ContactUsComponent,
      },
      {
        path: officialActivity.editCarousel,
        component: EditCarouselComponent,
        canActivate: [AdminGuard],
      },
      {
        path: pageNoPermission,
        component: Page403Component,
      },
      {
        path: pageNotFound,
        component: Page404Component,
      },
      {
        path: '',
        redirectTo: officialActivity.activityList,
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: officialActivityNotFound,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OfficialActivityRoutingModule {}

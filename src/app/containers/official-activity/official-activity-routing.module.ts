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

const routes: Routes = [
  {
    path: '',
    component: OfficialActivityComponent,
    children: [
      {
        path: 'activity-list',
        component: ActivityListComponent
      },
      {
        path: 'my-activity',
        component: ActivityListComponent
      },
      {
        path: 'activity-detail',
        children: [
          {
            path: ':eventId',
            component: ActivityDetailComponent
          },
          {
            path: '',
            redirectTo: '/official-activity/404'
          }
        ]
      },
      {
        path: 'apply-activity',
        children: [
          {
            path: ':eventId',
            component: ApplyActivityComponent
          },
          {
            path: '',
            redirectTo: '/official-activity/404'
          }
        ]
      },
      {
        path: 'leaderboard',
        component: LeaderboardComponent
      },
      {
        path: 'contestant-list',
        children: [
          {
            path: ':eventId',
            component: ContestantListComponent,
            canActivate: [AdminGuard]
          },
          {
            path: '',
            redirectTo: '/official-activity/404'
          }
        ]
      },
      {
        path: 'edit-activity',
        children: [
          {
            path: ':eventId',
            component: EditActivityComponent,
            canActivate: [AdminGuard],
            canDeactivate: [EditGuard]
          },
          {
            path: '',
            redirectTo: '/official-activity/404'
          }
        ]
      },
      {
        path: 'contact-us',
        component: ContactUsComponent
      },
      {
        path: 'edit-carousel',
        component: EditCarouselComponent,
        canActivate: [AdminGuard]
      },
      {
        path: '403',
        component: Page403Component
      },
      {
        path: '404',
        component: Page404Component
      },
      {
        path: '',
        redirectTo: 'activity-list'
      },
      {
        path: '**',
        redirectTo: '/official-activity/404'
      }
    ]

  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OfficialActivityRoutingModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PortalComponent } from './containers/portal/portal.component';
import { appPath } from './app-path.const';

const { dashboard, officialActivity } = appPath;

const routes: Routes = [
  {
    path: dashboard.home,
    loadChildren: () =>
      import('./containers/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: officialActivity.home,
    loadChildren: () =>
      import('./containers/official-activity/official-activity.module').then(
        (m) => m.OfficialActivityModule
      ),
  },
  {
    path: '',
    component: PortalComponent,
    loadChildren: () => import('./containers/portal/portal.module').then((m) => m.PortalModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      /* enableTracing: true */
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}

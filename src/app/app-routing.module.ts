import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PortalComponent } from './containers/portal/portal.component';

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./containers/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'official-activity',
    loadChildren: () =>
      import('./containers/official-activity/official-activity.module').then(
        (m) => m.OfficialActivityModule
      ),
  },
  {
    path: '',
    component: PortalComponent,
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

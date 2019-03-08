import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Page404Component } from './shared/components/page404/page404.component';
import { PortalComponent } from './containers/portal/portal.component';
import { Page403Component } from './shared/components/page403/page403.component';

const routes: Routes = [
  { path: '', component: PortalComponent },
  {
    path: 'dashboard',
    redirectTo: 'dashboard/activity-list',
    pathMatch: 'full'
  },
  {
    path: 'dashboard/settings',
    redirectTo: 'dashboard/settings/user-settings',
    pathMatch: 'full'
  },
  { path: '404', component: Page404Component },
  { path: '403', component: Page403Component }
  // { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

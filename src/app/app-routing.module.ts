import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PortalComponent } from './containers/portal/portal.component';

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
  }
  // { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

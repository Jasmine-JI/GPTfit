import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PortalComponent } from './containers/portal/portal.component';

const routes: Routes = [
  { path: '', component: PortalComponent },
  {
    path: 'dashboard',
    loadChildren: () => import('./containers/dashboard/dashboard.module').then(m => m.DashboardModule)
  }
  /* 測試延遲載入用
  {
    path: 'dashboard',
    redirectTo: 'activity-list',
    pathMatch: 'full'
  }
   */
  // { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

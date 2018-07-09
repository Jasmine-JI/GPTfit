import { NgModule } from '@angular/core';
import { PreloadAllModules, Routes, RouterModule } from '@angular/router';
import { Page404Component } from './shared/components/page404/page404.component';
import { PortalComponent } from './containers/portal/portal.component';

const routes: Routes = [
  { path: '',  component: PortalComponent },
  {
    path: 'dashboard',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  { path: '404', component: Page404Component }
  // { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

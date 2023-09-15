import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { PortalComponent } from './containers/portal/portal.component';
import { appPath } from './app-path.const';

const { dashboard, officialActivity, equipmentManagement } = appPath;

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
    //裝置管理系統
    path: equipmentManagement.home,
    loadChildren: () =>
      import('./containers/equipment-management-system/equipment-management.module').then(
        (m) => m.EquipmentManagementModule
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
      // enableTracing: true,
      // preloadingStrategy: PreloadAllModules,
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      scrollOffset: [0, 64],
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}

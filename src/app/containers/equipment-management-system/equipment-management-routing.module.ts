import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EquipmentManagementComponent } from './equipment-management.component';
import { appPath } from '../../app-path.const';
import { LogInComponent } from './components/logIn/log-in.component';
import { EquipmentComponent } from './components/equipment/equipment.component';
import { Page403Component } from '../../shared/components/page403/page403.component';
import { Page404Component } from '../../shared/components/page404/page404.component';
import { equipmentAdminGuard } from './guards/equipment-admin.guard';
import { SearchComponent } from './components/search/search.component';
import { OrderComponent } from './components/order/order.component';

import { orderDetailResolver } from './resolvers/order-detail.resolver';
import { equipmentDetailResolver } from './resolvers/equipment-detail.resolver';
import { MaintenanceRequirementComponent } from './components/maintenance-requirement/maintenance-requirement.component';
import { fixReqDetailResolver } from './resolvers/fixReq-detail.resolver';
import { RepairComponent } from './components/repair/repair.component';

const { equipmentManagement, pageNoPermission, pageNotFound } = appPath;
const equipmentManagementNotFound = `${pageNotFound}`;

export const equipmentManagementNoPermission = `${pageNoPermission}`;

export const equipmentManagementSearch = `/${equipmentManagement.home}/${equipmentManagement.search}`;

export const equipmentManagementLogIn = `/${equipmentManagement.home}/${equipmentManagement.logIn}`;

const routes: Routes = [
  {
    path: '', //自動跳轉登入頁 equipment-management/log-in
    component: EquipmentManagementComponent,
    children: [
      {
        path: equipmentManagement.logIn,
        component: LogInComponent,
      },

      {
        path: equipmentManagement.search, //登入成功==挑轉至==>搜尋
        component: SearchComponent,
        canActivate: [equipmentAdminGuard],
      },
      {
        path: equipmentManagement.order, //銷貨單詳細頁
        component: OrderComponent,
        canActivate: [equipmentAdminGuard],
        children: [
          {
            path: `:${equipmentManagement.order_no}`,
            component: OrderComponent,
            resolve: { orderDetail: orderDetailResolver },
          },
          {
            path: '',
            redirectTo: equipmentManagementNotFound,
            pathMatch: 'full',
          },
        ],
      },
      {
        path: equipmentManagement.equipment, //產品詳細頁
        component: EquipmentComponent,
        canActivate: [equipmentAdminGuard],
        children: [
          {
            path: `:${equipmentManagement.equipment_sn}`,
            component: EquipmentComponent,
            resolve: { product: equipmentDetailResolver },
          },
          {
            path: '',
            redirectTo: equipmentManagementNotFound,
            pathMatch: 'full',
          },
        ],
      },
      {
        path: equipmentManagement.maintenanceRequirement, //叫修單
        component: MaintenanceRequirementComponent,
        canActivate: [equipmentAdminGuard],
        children: [
          {
            path: `:${equipmentManagement.repair_id}`,
            component: MaintenanceRequirementComponent,
            resolve: { fixReq: fixReqDetailResolver },
          },
          {
            path: '',
            redirectTo: equipmentManagementNotFound,
            pathMatch: 'full',
          },
        ],
      },
      {
        path: equipmentManagement.repair, //維修單
        component: RepairComponent,
        canActivate: [equipmentAdminGuard],
        children: [
          {
            path: '',
            redirectTo: equipmentManagementNotFound,
            pathMatch: 'full',
          },
        ],
      },

      {
        path: equipmentManagementNoPermission,
        component: Page403Component,
      },
      {
        path: pageNotFound,
        component: Page404Component,
      },
      {
        path: '',
        redirectTo: equipmentManagement.logIn,
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: equipmentManagementNotFound,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  // providers:[orderDetailResolver]
})
export class EquipmentManagementRoutingModule {}

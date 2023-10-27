import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EquipmentManagementComponent } from './equipment-management.component';
import { appPath } from '../../app-path.const';
import { LogInComponent } from './components/logIn/log-in.component';
import { EquipmentComponent } from './components/equipment/equipment.component';
import { Page403Component } from '../../shared/components/page403/page403.component';
import { Page404Component } from '../../shared/components/page404/page404.component';
import { equipmentAdminGuard } from './guards/equipment-admin.guard';
import { NewsComponent } from './components/news/news.component';
import { SearchComponent } from './components/search/search.component';
import { OrderComponent } from './components/order/order.component';

import { orderDetailResolver } from './resolvers/order-detail.resolver';
import { equipmentDetailResolver } from './resolvers/equipment-detail.resolver';
import { MaintenanceRequirementComponent } from './components/maintenance-requirement/maintenance-requirement.component';
import { fixReqDetailResolver } from './resolvers/fixReq-detail.resolver';
import { RepairComponent } from './components/repair/repair.component';
import { breadcrumbResolver } from './resolvers/breadcrumb.resolver';

const { equipmentManagement, pageNoPermission, pageNotFound } = appPath;
const equipmentManagementNotFound = `${pageNotFound}`;

export const equipmentManagementNoPermission = `${pageNoPermission}`;

export const equipmentManagementNews = `/${equipmentManagement.home}/${equipmentManagement.news}`;

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
        path: equipmentManagement.news, //登入成功-挑轉至==>最新單據
        component: NewsComponent,
        canActivate: [equipmentAdminGuard],
        resolve: { breadcrumb: breadcrumbResolver },
        data: {
          breadcrumb: '首頁',
        },
      },
      {
        path: equipmentManagement.search, //搜尋結果頁
        component: SearchComponent,
        canActivate: [equipmentAdminGuard],
        resolve: { breadcrumb: breadcrumbResolver },
        data: {
          breadcrumb: '搜尋結果',
        },
      },
      {
        path: equipmentManagement.order, //銷貨單詳細頁
        component: OrderComponent,
        canActivate: [equipmentAdminGuard],
        data: {
          breadcrumb: '銷貨單',
        },
        children: [
          {
            path: `:${equipmentManagement.order_no}`,
            component: OrderComponent,
            canActivate: [equipmentAdminGuard],
            resolve: { orderDetail: orderDetailResolver },
            data: {
              breadcrumb: '銷貨單',
            },
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
            data: {
              breadcrumb: '產品',
            },
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
        data: {
          breadcrumb: '叫修單',
        },
        children: [
          {
            path: `:${equipmentManagement.repair_id}`,
            component: MaintenanceRequirementComponent,
            resolve: { fixReq: fixReqDetailResolver },
            data: {
              breadcrumb: '叫修單',
            },
          },
          {
            path: '',
            redirectTo: equipmentManagementNotFound,
            pathMatch: 'full',
          },
        ],
      },
      {
        path: `${equipmentManagement.repair}/:id`, //維修單
        component: RepairComponent,
        canActivate: [equipmentAdminGuard],
        resolve: { breadcrumb: breadcrumbResolver },
        data: {
          breadcrumb: '維修單',
        },
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

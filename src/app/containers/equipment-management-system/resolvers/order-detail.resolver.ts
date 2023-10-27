import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { EquipmentManagementService } from '../services/equipment-management.service';
import { inject } from '@angular/core';

export const orderDetailResolver = (
  route: ActivatedRouteSnapshot,
  activatedRoute: ActivatedRoute
) => {
  const orderParameters = { order_no: 0 };
  const id = +route.paramMap.get('order_no');
  orderParameters.order_no = id;
  inject(EquipmentManagementService).setOrderParameters(orderParameters);

  const label = route.data['breadcrumb'];
  const params = route.params;
  const url = activatedRoute.url;
  const breadcrumb = { label, params, url };
  console.log(breadcrumb);

  inject(EquipmentManagementService).createBreadcrumb(breadcrumb);
};

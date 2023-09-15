import { ActivatedRouteSnapshot } from '@angular/router';
import { EquipmentManagementService } from '../services/equipment-management.service';
import { inject } from '@angular/core';

export const orderDetailResolver = (route: ActivatedRouteSnapshot) => {
  const orderParameters = { order_no: 0 };
  const id = +route.paramMap.get('order_no');
  orderParameters.order_no = id;
  inject(EquipmentManagementService).setOrderParameters(orderParameters);
};

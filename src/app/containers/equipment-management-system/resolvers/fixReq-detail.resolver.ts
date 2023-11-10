import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { EquipmentManagementService } from '../services/equipment-management.service';
import { inject } from '@angular/core';

export const fixReqDetailResolver = (
  route: ActivatedRouteSnapshot,
  activatedRoute: ActivatedRoute
) => {
  const fixReqParameters = { repair_id: 0 };
  const id = +route.paramMap.get('repair_id');
  fixReqParameters.repair_id = id;
  inject(EquipmentManagementService).setFixReqParameters(fixReqParameters);

  const label = route.data['breadcrumb'];
  const params = route.params;
  const url = activatedRoute.url;
  const breadcrumb = { label, params, url };
  // console.log(breadcrumb);

  inject(EquipmentManagementService).createBreadcrumb(breadcrumb);
};

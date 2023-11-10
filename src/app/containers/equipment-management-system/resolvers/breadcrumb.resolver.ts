import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { EquipmentManagementService } from '../services/equipment-management.service';
import { inject } from '@angular/core';

export const breadcrumbResolver = (
  route: ActivatedRouteSnapshot,
  activatedRoute: ActivatedRoute
) => {
  const label = route.data['breadcrumb'];
  const params = route.params;
  const url = activatedRoute.url;
  const breadcrumb = { label, params, url };
  // console.log(breadcrumb);

  inject(EquipmentManagementService).createBreadcrumb(breadcrumb);
};

import { ActivatedRouteSnapshot } from '@angular/router';
import { EquipmentManagementService } from '../services/equipment-management.service';
import { inject } from '@angular/core';

export const fixReqDetailResolver = (route: ActivatedRouteSnapshot) => {
  const fixReqParameters = { repair_id: 0 };
  const id = +route.paramMap.get('repair_id');
  fixReqParameters.repair_id = id;
  inject(EquipmentManagementService).setFixReqParameters(fixReqParameters);
};

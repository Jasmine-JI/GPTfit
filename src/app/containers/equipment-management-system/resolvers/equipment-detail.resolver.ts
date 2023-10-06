import { ActivatedRouteSnapshot } from '@angular/router';
import { EquipmentManagementService } from '../services/equipment-management.service';
import { inject } from '@angular/core';

export const equipmentDetailResolver = (route: ActivatedRouteSnapshot) => {
  const productParameters = { serial_no: '' };
  console.log(route.paramMap);

  const id = route.paramMap.get('equipment_sn');
  productParameters.serial_no = id;
  inject(EquipmentManagementService).setEquipParameters(productParameters);
};

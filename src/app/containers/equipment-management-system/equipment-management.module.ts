import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { EquipmentComponent } from './components/equipment/equipment.component';

import { OrderComponent } from './components/order/order.component';
import { SearchComponent } from './components/search/search.component';
import { EquipmentManagementRoutingModule } from './equipment-management-routing.module';
import { LogInComponent } from './components/logIn/log-in.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EquipmentManagementRoutingModule,
    LogInComponent,
    EquipmentComponent,
    OrderComponent,
    SearchComponent,
    MatIconModule,
  ],
})
export class EquipmentManagementModule {}

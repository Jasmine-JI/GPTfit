import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PortalRoutingModule } from './portal-routing.module';
import { PortalComponent } from './portal.component';

@NgModule({
  imports: [
    CommonModule,
    PortalRoutingModule
  ],
  declarations: [PortalComponent]
})
export class PortalModule { }

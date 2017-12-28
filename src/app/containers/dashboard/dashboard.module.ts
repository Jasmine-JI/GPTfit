import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedComponentsModule } from '@shared/components/shared-components.module';
import { EnrollFormComponent } from './components/enroll-form/enroll-form.component';
import { FormsModule } from '@angular/forms';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { EventComponent } from './components/event/event.component';
import { EditEventComponent } from './components/edit-event/edit-event.component';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedComponentsModule,
    FormsModule
  ],
  declarations: [
    DashboardComponent,
    EnrollFormComponent,
    CreateEventComponent,
    EventComponent,
    EditEventComponent,
  ],
})
export class DashboardModule { }

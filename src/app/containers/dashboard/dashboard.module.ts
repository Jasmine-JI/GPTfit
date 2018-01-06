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
import { CertificatePreviewComponent } from './components/certificate-preview/certificate-preview.component';
import { CertificateComponent } from './components/certificate/certificate.component';
import { MyDatePickerModule } from 'mydatepicker';
import { EventEnrollService } from './services/event-enroll.service';
import { EventCalendarComponent } from './components/event-calendar/event-calendar.component';
import { CustomMaterialModule } from '@shared/custom-material.module.ts';
import { EnrollPreviewComponent } from './components/enroll-preview/enroll-preview.component';
import { GlobalEventsManager } from '@shared/global-events-manager';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedComponentsModule,
    FormsModule,
    MyDatePickerModule,
    CustomMaterialModule
  ],
  providers: [
    EventEnrollService,
    GlobalEventsManager
  ],
  declarations: [
    DashboardComponent,
    EnrollFormComponent,
    CreateEventComponent,
    EventComponent,
    EditEventComponent,
    CertificatePreviewComponent,
    CertificateComponent,
    EventCalendarComponent,
    EnrollPreviewComponent
  ]
})
export class DashboardModule {}

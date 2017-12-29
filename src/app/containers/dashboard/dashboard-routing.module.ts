import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { EnrollFormComponent } from './components/enroll-form/enroll-form.component';
import { EventComponent } from './components/event/event.component';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { EditEventComponent } from './components/edit-event/edit-event.component';
import { CertificateComponent } from './components/certificate/certificate.component';
import { CertificatePreviewComponent } from './components/certificate-preview/certificate-preview.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      {
        path: 'enroll',
        component: EnrollFormComponent
      },
      {
        path: 'event',
        component: EventComponent
      },
      {
        path: 'certificate',
        component: CertificateComponent
      },
      {
        path: 'certificate/preview',
        component: CertificatePreviewComponent
      },
      {
        path: 'event/create',
        component: CreateEventComponent
      },
      {
        path: 'event/edit',
        component: EditEventComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }

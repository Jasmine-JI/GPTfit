import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfessionalComponent } from './professional.component';
import { appPath } from '../../app-path.const';


const routes: Routes = [
  {
    path: '',
    component: ProfessionalComponent,
    children: [
      
      {
        path: '**',
        redirectTo: '404'
      }

    ]

  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }

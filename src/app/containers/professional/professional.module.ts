import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SportsReportComponent } from './sports-report/sports-report.component';
import { ProfessionalComponent } from './professional.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [
    SportsReportComponent,
    ProfessionalComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class ProfessionalModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SportsReportComponent } from './sports-report/sports-report.component';
import { ProfessionalComponent } from './professional.component';



@NgModule({
  declarations: [
    SportsReportComponent,
    ProfessionalComponent
  ],
  imports: [
    CommonModule
  ]
})
export class ProfessionalModule { }

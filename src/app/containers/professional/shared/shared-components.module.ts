import { NgModule, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisInfoMenuComponent } from './analysis-info-menu/analysis-info-menu.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [
    AnalysisInfoMenuComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    AnalysisInfoMenuComponent
  ]
})
export class SharedComponentsModule {}

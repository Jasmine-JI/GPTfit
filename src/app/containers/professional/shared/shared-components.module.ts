import { NgModule, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisOptionComponent } from './analysis-option/analysis-option.component';
import { AnalysisInfoMenuComponent } from './analysis-info-menu/analysis-info-menu.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [
    AnalysisOptionComponent,
    AnalysisInfoMenuComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    AnalysisOptionComponent,
    AnalysisInfoMenuComponent
  ]
})
export class SharedComponentsModule {}

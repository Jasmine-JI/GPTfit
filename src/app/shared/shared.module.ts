import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MuscleNamePipe } from './pipes/muscle-name.pipe';
import { DataTypeTranslatePipe } from './pipes/data-type-translate.pipe';
import { DataTypeUnitPipe } from './pipes/data-type-unit.pipe';
import { TemperatureSibsPipe } from './pipes/temperature-sibs.pipe';
import { SportPaceSibsPipe } from './pipes/sport-pace-sibs.pipe';

@NgModule({
  exports: [
    TranslateModule,
  ],
  providers: [
    MuscleNamePipe,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    TemperatureSibsPipe,
    SportPaceSibsPipe
  ]
})

export class SharedModule { }

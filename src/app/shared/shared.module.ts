import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MuscleNamePipe } from './pipes/muscle-name.pipe';
import { DataTypeTranslatePipe } from './pipes/data-type-translate.pipe';
import { DataTypeUnitPipe } from './pipes/data-type-unit.pipe';
import { TemperatureSibsPipe } from './pipes/temperature-sibs.pipe';
import { SportPaceSibsPipe } from './pipes/sport-pace-sibs.pipe';
import { TargetFieldNamePipe } from './pipes/target-field-name.pipe';
import { DateUnitKeyModule } from '../core/pipes/date-unit-key.pipe';

@NgModule({
  exports: [TranslateModule],
  imports: [DateUnitKeyModule],
  providers: [
    MuscleNamePipe,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    TemperatureSibsPipe,
    SportPaceSibsPipe,
    TargetFieldNamePipe,
  ],
})
export class SharedModule {}

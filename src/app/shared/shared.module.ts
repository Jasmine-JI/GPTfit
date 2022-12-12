import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MuscleNamePipe } from './pipes/muscle-name.pipe';
import { DataTypeTranslatePipe } from './pipes/data-type-translate.pipe';
import { DataTypeUnitPipe } from './pipes/data-type-unit.pipe';
import { TemperatureSibsPipe } from './pipes/temperature-sibs.pipe';
import { TargetFieldNamePipe } from './pipes/target-field-name.pipe';
import { DateUnitKeyModule, SportPaceSibsModule, SportTypeIconModule } from '../core/pipes';

@NgModule({
  exports: [TranslateModule],
  imports: [DateUnitKeyModule, SportPaceSibsModule, SportTypeIconModule],
  providers: [
    MuscleNamePipe,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    TemperatureSibsPipe,
    TargetFieldNamePipe,
  ],
})
export class SharedModule {}

import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MuscleNamePipe } from '../core/pipes/muscle-name.pipe';
import { DataTypeTranslatePipe } from '../core/pipes/data-type-translate.pipe';
import { DataTypeUnitPipe } from '../core/pipes/data-type-unit.pipe';
import { TemperatureSibsPipe } from '../core/pipes/temperature-sibs.pipe';
import { TargetFieldNamePipe } from '../core/pipes/target-field-name.pipe';
import { DateUnitKeyPipe, SportPaceSibsPipe, SportTypeIconPipe } from '../core/pipes';

@NgModule({
  exports: [TranslateModule],
  imports: [DateUnitKeyPipe, SportPaceSibsPipe, SportTypeIconPipe],
  providers: [
    MuscleNamePipe,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    TemperatureSibsPipe,
    TargetFieldNamePipe,
  ],
})
export class SharedModule {}

import { NgModule } from '@angular/core';
import { SexPipe } from './sex.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';
import { ProductTypePipe } from './product-type.pipe';
import { LineBreakPipe } from './line-break.pipe';
import { GroupStatusPipe } from './group-status.pipe';
import { GroupLevelNamePipe } from './group-level-name.pipe';
import { SportTimePipe } from './sport-time.pipe';
import { MuscleNamePipe } from './muscle-name.pipe';
import { SlicePipe } from './slice.pipe';
import { A3FormatPipe } from './a3-format.pipe';
import { RelativeDayPipe } from './relative-day.pipe';
import { TimeFormatPipe } from './time-format.pipe';
import { RegionCodePipe } from './region-code.pipe';
import { LanguageCodePipe } from './language-code.pipe';
import { AppIdPipe } from './app-id.pipe';
import { SystemIdPipe } from './system-id.pipe';
import { SportTypePipe } from './sport-type.pipe';
import { SportTypeIconPipe } from './sport-type-icon.pipe';
import { LongTextPipe } from './long-text.pipe';
import { GroupIdSlicePipe } from './group-id-slice.pipe';
import { ThousandConversionPipe } from './thousand-conversion.pipe';
import { SportPaceSibsPipe } from './sport-pace-sibs.pipe';
import { DistanceSibsPipe } from './distance-sibs.pipe';
import { WeightSibsPipe } from './weight-sibs.pipe';
import { SpeedSibsPipe } from './speed-sibs.pipe';
import { TemperatureSibsPipe } from './temperature-sibs.pipe';
import { swimPosture } from './swim-posture.pipe';
import { DataTypeTranslatePipe } from './data-type-translate.pipe';
import { DataTypeUnitPipe } from './data-type-unit.pipe';
import { PaiPipe } from './pai.pipe';
import { FindPreferPipe } from './find-prefer.pipe';
import { MuscleGroupIconPipe } from './muscle-group-icon.pipe';
import { PythagoreanPipe } from './pythagorean.pipe';
import { MathAbsPipe } from './math-abs.pipe';

@NgModule({
  imports: [
    // dep modules
  ],
  declarations: [
    SexPipe,
    SafeHtmlPipe,
    ProductTypePipe,
    LineBreakPipe,
    GroupStatusPipe,
    GroupLevelNamePipe,
    SportTimePipe,
    MuscleNamePipe,
    SlicePipe,
    A3FormatPipe,
    RelativeDayPipe,
    TimeFormatPipe,
    RegionCodePipe,
    LanguageCodePipe,
    AppIdPipe,
    SystemIdPipe,
    SportTypePipe,
    SportTypeIconPipe,
    LongTextPipe,
    GroupIdSlicePipe,
    ThousandConversionPipe,
    SportPaceSibsPipe,
    DistanceSibsPipe,
    WeightSibsPipe,
    SpeedSibsPipe,
    TemperatureSibsPipe,
    swimPosture,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    PaiPipe,
    FindPreferPipe,
    MuscleGroupIconPipe,
    PythagoreanPipe,
    MathAbsPipe
  ],
  exports: [
    SexPipe,
    SafeHtmlPipe,
    ProductTypePipe,
    LineBreakPipe,
    GroupStatusPipe,
    GroupLevelNamePipe,
    SportTimePipe,
    MuscleNamePipe,
    SlicePipe,
    A3FormatPipe,
    RelativeDayPipe,
    TimeFormatPipe,
    RegionCodePipe,
    LanguageCodePipe,
    AppIdPipe,
    SystemIdPipe,
    SportTypePipe,
    SportTypeIconPipe,
    LongTextPipe,
    GroupIdSlicePipe,
    ThousandConversionPipe,
    SportPaceSibsPipe,
    DistanceSibsPipe,
    WeightSibsPipe,
    SpeedSibsPipe,
    TemperatureSibsPipe,
    swimPosture,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    PaiPipe,
    FindPreferPipe,
    MuscleGroupIconPipe,
    PythagoreanPipe,
    MathAbsPipe
  ]
})
export class SharedPipes {}

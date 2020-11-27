import { NgModule } from '@angular/core';
import { SexPipe } from './sex.pipe';
import { TimePipe } from './time.pipe';
import { MapTranslatePipe } from './map-translate.pipe';
import { UnixTimeConvertPipe } from './unix-time-convert.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';
import { ProductTypePipe } from './product-type.pipe';
import { LineBreakPipe } from './line-break.pipe';
import { GroupStatusPipe } from './group-status.pipe';
import { GroupLevelNamePipe } from './group-level-name.pipe';
import { SportDatePipe } from './sport-date.pipe';
import { SportTimePipe } from './sport-time.pipe';
import { SportPacePipe } from './sport-pace.pipe';
import { MuscleNamePipe } from './muscle-name.pipe';
import { SlicePipe } from './slice.pipe';
import { A3FormatPipe } from './a3-format.pipe';
import { CloudrunSummaryPipe } from './cloudrun-summary.pipe';
import { RelativeDayPipe } from './relative-day.pipe';
import { TimeFormatPipe } from './time-format.pipe';
import { RegionCodePipe } from './region-code.pipe';
import { LanguageCodePipe } from './language-code.pipe';
import { AppIdPipe } from './app-id.pipe';
import { SystemIdPipe } from './system-id.pipe';
import { SportTypePipe } from './sport-type.pipe';
import { SportTypeIconPipe } from './sport-type-icon.pipe';


@NgModule({
  imports: [
    // dep modules
  ],
  declarations: [
    SexPipe,
    TimePipe,
    MapTranslatePipe,
    UnixTimeConvertPipe,
    SafeHtmlPipe,
    ProductTypePipe,
    LineBreakPipe,
    GroupStatusPipe,
    GroupLevelNamePipe,
    SportDatePipe,
    SportTimePipe,
    SportPacePipe,
    MuscleNamePipe,
    SlicePipe,
    A3FormatPipe,
    CloudrunSummaryPipe,
    RelativeDayPipe,
    TimeFormatPipe,
    RegionCodePipe,
    LanguageCodePipe,
    AppIdPipe,
    SystemIdPipe,
    SportTypePipe,
    SportTypeIconPipe
  ],
  exports: [
    SexPipe,
    TimePipe,
    MapTranslatePipe,
    UnixTimeConvertPipe,
    SafeHtmlPipe,
    ProductTypePipe,
    LineBreakPipe,
    GroupStatusPipe,
    GroupLevelNamePipe,
    SportDatePipe,
    SportTimePipe,
    SportPacePipe,
    MuscleNamePipe,
    SlicePipe,
    A3FormatPipe,
    CloudrunSummaryPipe,
    RelativeDayPipe,
    TimeFormatPipe,
    RegionCodePipe,
    LanguageCodePipe,
    AppIdPipe,
    SystemIdPipe,
    SportTypePipe,
    SportTypeIconPipe
  ]
})
export class SharedPipes {}

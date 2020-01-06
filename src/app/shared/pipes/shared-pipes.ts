import { NgModule } from '@angular/core';
import { SexPipe } from '@shared/pipes/sex.pipe';
import { TimePipe } from '@shared/pipes/time.pipe';
import { MapTranslatePipe } from '@shared/pipes/map-translate.pipe';
import { UnixTimeConvertPipe } from '@shared/pipes/unix-time-convert.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { ProductTypePipe } from '@shared/pipes/product-type.pipe';
import { LineBreakPipe } from './line-break.pipe';
import { GroupStatusPipe } from './group-status.pipe';
import { GroupLevelNamePipe } from './group-level-name.pipe';
import { SportDatePipe } from '@shared/pipes/sport-date.pipe';
import { SportTimePipe } from '@shared/pipes/sport-time.pipe';
import { SportPacePipe } from '@shared/pipes/sport-pace.pipe';
import { MuscleNamePipe } from './muscle-name.pipe';
import { SlicePipe } from './slice.pipe';


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
    SlicePipe
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
    SlicePipe
  ]
})
export class SharedPipes {}

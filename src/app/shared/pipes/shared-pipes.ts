import { NgModule } from '@angular/core';
import { SexPipe } from '@shared/pipes/sex.pipe';
import { TimePipe } from '@shared/pipes/time.pipe';
import { MapTranslatePipe } from '@shared/pipes/map-translate.pipe';
import { UnixTimeConvertPipe } from '@shared/pipes/unix-time-convert.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';

@NgModule({
  imports: [
    // dep modules
  ],
  declarations: [
    SexPipe,
    TimePipe,
    MapTranslatePipe,
    UnixTimeConvertPipe,
    SafeHtmlPipe
  ],
  exports: [
    SexPipe,
    TimePipe,
    MapTranslatePipe,
    UnixTimeConvertPipe,
    SafeHtmlPipe
  ]
})
export class SharedPipes {}

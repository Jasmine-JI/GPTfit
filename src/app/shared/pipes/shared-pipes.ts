import { NgModule } from '@angular/core';
import { SexPipe } from '@shared/pipes/sex.pipe';
import { TimePipe } from '@shared/pipes/time.pipe';
import { MapTranslatePipe } from '@shared/pipes/map-translate.pipe';

@NgModule({
  imports: [
    // dep modules
  ],
  declarations: [
    SexPipe,
    TimePipe,
    MapTranslatePipe
  ],
  exports: [
    SexPipe,
    TimePipe,
    MapTranslatePipe
  ]
})
export class SharedPipes {}

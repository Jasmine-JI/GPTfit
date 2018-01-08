import { NgModule } from '@angular/core';
import { SexPipe } from '@shared/pipes/sex.pipe';
import { TimePipe } from '@shared/pipes/time.pipe';

@NgModule({
  imports: [
    // dep modules
  ],
  declarations: [
    SexPipe,
    TimePipe
  ],
  exports: [
    SexPipe,
    TimePipe
  ]
})
export class SharedPipes {}

import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MuscleNamePipe } from './pipes/muscle-name.pipe';

@NgModule({
  exports: [
    TranslateModule,
  ],
  providers: [
    MuscleNamePipe
  ]
})

export class SharedModule { }

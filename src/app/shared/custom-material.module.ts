import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatIconModule,
  MatButtonModule,
  MatListModule,
  MatToolbarModule,
  MatTooltipModule,
  MatSidenavModule,
  MatCardModule,
  MatGridListModule
} from '@angular/material';

@NgModule({
  imports: [
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSidenavModule,
    MatCardModule,
    MatGridListModule
  ],
  exports: [
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSidenavModule,
    MatCardModule,
    MatGridListModule
  ]
})
export class CustomMaterialModule {}

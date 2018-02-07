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
  MatGridListModule,
  MatDialogModule,
  MatCheckboxModule
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
    MatGridListModule,
    MatDialogModule,
    MatCheckboxModule
  ],
  exports: [
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSidenavModule,
    MatCardModule,
    MatGridListModule,
    MatDialogModule,
    MatCheckboxModule
  ]
})
export class CustomMaterialModule {}

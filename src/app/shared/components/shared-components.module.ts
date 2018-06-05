import { NgModule, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { Page404Component } from './page404/page404.component';
import { LoadingComponent } from './loading/loading.component';
import { PaginationComponent } from './pagination/pagination.component';
import { UploadFileComponent } from './upload-file/upload-file.component';
import { RouterModule } from '@angular/router';
import { IntlPhoneInputComponent } from './intl-phone-input/intl-phone-input.component';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared.module';
import { MessageBoxComponent } from './message-box/message-box.component';
import { CustomMaterialModule } from '../custom-material.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    CustomMaterialModule
  ],
  declarations: [
    NavbarComponent,
    Page404Component,
    LoadingComponent,
    PaginationComponent,
    UploadFileComponent,
    IntlPhoneInputComponent,
    MessageBoxComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    NavbarComponent,
    Page404Component,
    LoadingComponent,
    PaginationComponent,
    UploadFileComponent,
    IntlPhoneInputComponent,
    MessageBoxComponent
  ]
})
export class SharedComponentsModule {}

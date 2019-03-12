import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  MatCheckboxModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatFormFieldModule,
  MatInputModule,
  MatDatepickerModule,
  // MAT_DATE_LOCALE,
  // MAT_DATE_FORMATS,
  MatRadioModule,
  MatSelectModule,
  MatAutocompleteModule,
  MatProgressSpinnerModule,
  MatSnackBarModule,
  MatTabsModule,
  MatExpansionModule,
  MatTreeModule,
  MatBadgeModule,
  MatSlideToggleModule,
  MatButtonToggleModule,
  DateAdapter
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { LayoutModule } from '@angular/cdk/layout';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

export const TW_FORMATS = { // 可以自己定義時間格式，因為原本material設定台灣時間格式就是我們要的XX/XX/XX，所以這個變數沒用到
  parse: {
    dateInput: 'YYYY/MM/DD'
  },
  display: {
    dateInput: 'YYYY/MM/DD',
    monthYearLabel: 'YYYY MMM',
    dateA11yLabel: 'YYYY/MM/DD',
    monthYearA11yLabel: 'YYYY MMM'
  }
};

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
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatRadioModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatExpansionModule,
    MatTreeModule,
    MatBadgeModule,
    MatBottomSheetModule,
    MatSlideToggleModule,
    MatButtonToggleModule
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
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    LayoutModule,
    MatRadioModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatExpansionModule,
    MatTreeModule,
    MatBadgeModule,
    MatBottomSheetModule,
    MatSlideToggleModule,
    MatButtonToggleModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    // { provide: MAT_DATE_FORMATS, useValue: TW_FORMATS }
  ]
})
export class CustomMaterialModule {
  constructor(
    private translate: TranslateService,
    private adapter: DateAdapter<any>
  ) {
    translate.onLangChange.subscribe((params: LangChangeEvent) => {
      let lang = 'zh-tw';
      switch (params.lang) {
        case 'zh-cn':
          lang = 'zh-CN';
          break;
        case 'zh-tw':
          lang = 'zh-TW';
          break;
        case 'en-us':
          lang = 'en-GB'; // 這個直接去 node_modules/moment/locale/資料夾下，看妳目標語系的檔名，就是
          break;
        default:
          break;
      }
      adapter.setLocale(lang);
    });
  }
}


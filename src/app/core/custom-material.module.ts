import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import {
  // MAT_DATE_LOCALE,
  // MAT_DATE_FORMATS,
  MatLegacyRadioModule as MatRadioModule,
} from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { LayoutModule } from '@angular/cdk/layout';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

export const TW_FORMATS = {
  // 可以自己定義時間格式，因為原本material設定台灣時間格式就是我們要的XX/XX/XX，所以這個變數沒用到
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'YYYY MMM',
    dateA11yLabel: 'YYYY-MM-DD',
    monthYearA11yLabel: 'YYYY MMM',
  },
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
    MatButtonToggleModule,
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
    MatButtonToggleModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    // { provide: MAT_DATE_FORMATS, useValue: TW_FORMATS }
  ],
})
export class CustomMaterialModule {
  constructor(private translate: TranslateService, private adapter: DateAdapter<any>) {
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
          lang = 'en-GB'; // 這個直接去 node_modules/dayjs/locale/資料夾下，看妳目標語系的檔名，就是
          break;
        default:
          break;
      }
      adapter.setLocale(lang);
    });
  }
}

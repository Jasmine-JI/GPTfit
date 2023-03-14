import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class CorrespondTranslateKeyService {
  constructor(private translate: TranslateService) {}

  /**
   * 裝置 fieldName 代號轉為翻譯鍵名
   * @param code {string}-裝置統計數據代號
   */
  ageCodeConvert(code: string) {
    const ageKey = this.translate.instant('universal_deviceSetting_yearsOld');
    switch (code) {
      case 'o1':
        return '20歲以下';
      case 'o2':
        return `21-30 ${ageKey}`;
      case 'o3':
        return `31-40 ${ageKey}`;
      case 'o4':
        return `41-50 ${ageKey}`;
      case 'o5':
        return `51-60 ${ageKey}`;
      case 'o6':
        return '61歲以上';
      default:
        return 'universal_vocabulary_other';
    }
  }
}

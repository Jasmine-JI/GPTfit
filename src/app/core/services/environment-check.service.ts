import { Injectable } from '@angular/core';
import { version } from '../version';
import { setLocalStorageObject, getLocalStorageObject } from '../utils';
import { TranslateService } from '@ngx-translate/core';
import { Domain } from '../enums/common/domain.enum';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentCheckService {
  constructor(private translateService: TranslateService) {}

  /**
   * 確認web版本
   * @return [是否為alpha版, 版本號]
   */
  checkWebVersion(): [boolean, string] {
    let isAlphaVersion = true;
    let appVersion = version.develop;
    const { hostname } = location;
    const { oldProd, newProd, uat } = Domain;
    const isOldProdDomain = hostname.indexOf(oldProd) > -1;
    const isNewProdDomain = hostname.indexOf(newProd) > -1;
    const isAlphaDomain = hostname.indexOf(uat) > -1;
    if (isOldProdDomain || isNewProdDomain) {
      isAlphaVersion = false;
      appVersion = version.master;
    } else if (isAlphaDomain) {
      appVersion = version.release;
    } else {
      appVersion = version.develop;
    }

    return [isAlphaVersion, appVersion];
  }

  /**
   * 確認使用語言
   */
  checkBrowserLang() {
    let browserLang = getLocalStorageObject('locale');
    if (!browserLang) {
      browserLang = this.translateService.getBrowserCultureLang().toLowerCase();
      this.translateService.use(browserLang);
      setLocalStorageObject('locale', browserLang);
    } else {
      this.translateService.use(browserLang);
    }
  }
}

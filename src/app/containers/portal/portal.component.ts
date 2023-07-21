import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { DetectInappService } from '../../core/services';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { langList } from '../../core/models/const';
import { setLocalStorageObject, getLocalStorageObject } from '../../core/utils';
import { QueryString } from '../../core/enums/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NgIf, NgClass } from '@angular/common';
import { IntroductionComponent } from './components/introduction/introduction.component';
import { RouterOutlet } from '@angular/router';
import { GlobalEventsService, EnvironmentCheckService } from '../../core/services';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss'],
  standalone: true,
  imports: [NgIf, NavbarComponent, NgClass, RouterOutlet, TranslateModule, IntroductionComponent],
})
export class PortalComponent implements OnInit, OnDestroy, AfterViewInit {
  private ngUnsubscribe = new Subject();
  uiFlag = {
    page: 'system',
    isAlphaVersion: false,
    isPreviewMode: false,
    hideNavbar: false,
    showMask: false,
    darkMode: false,
    showActivityEntry: false,
  };

  activePage = '';
  isIntroductionPage: boolean;

  constructor(
    public translateService: TranslateService,
    private detectInappService: DetectInappService,
    private environmentCheckService: EnvironmentCheckService,
    private globalEventsService: GlobalEventsService,
    private route: ActivatedRoute
  ) {
    if (location.search.indexOf(`${QueryString.printMode}=s`) > -1) {
      this.uiFlag.isPreviewMode = true;
    }
  }

  ngOnInit() {
    this.checkBrowser();
    this.checkDomain();
    this.checkLanguage();
  }

  ngAfterViewInit() {
    // 使用setTimeout處理ExpressionChangedAfterItHasBeenCheckedError報錯
    setTimeout(() => this.checkUiSetting());

    window.scrollTo({ top: 0, behavior: 'auto' });
    this.checkLanguage(); // 因應手機平台，故在此生命週期再判斷一次語系
  }

  /**
   * 若非使用Line或其他App或IE以外瀏覽器時，跳出解析度警示框
   * @author Kidin-1081023
   */
  checkBrowser() {
    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.detectInappService.checkBrowser();
    });
  }

  /**
   * 確認為正式或測試環境
   * @author kidin-1091008
   */
  checkDomain() {
    this.uiFlag.isAlphaVersion = this.environmentCheckService.checkWebVersion()[0];
  }

  /**
   * 確認語言
   * @author kidin-1091008
   */
  checkLanguage() {
    // 根據不同平台使用不同方式取得語系
    let browserLang: string;
    if ((window as any).android) {
      browserLang = this.getUrlLanguageString(location.search);
    } else if ((window as any).webkit) {
      browserLang = navigator.language.toLowerCase() || 'en-us';
    } else {
      browserLang = getLocalStorageObject('locale') || navigator.language.toLowerCase();
    }

    if (browserLang === 'pt-br') {
      browserLang = 'pt-pt'; // 巴西語預設顯示葡萄牙語-kidin-1091203
    } else if (langList.findIndex((_locale) => _locale === browserLang) === -1) {
      browserLang = 'en-us'; // default en-us
    }

    this.translateService.use(browserLang);
    setLocalStorageObject('locale', browserLang);
  }

  /**
   * 從網址取得語系
   * @param str {string}-query string
   * @author kidin-1091222
   */
  getUrlLanguageString(str: string) {
    if (navigator && navigator.language) {
      return navigator.language.toLowerCase();
    } else if (str.indexOf('l=') > -1) {
      const tempStr = str.split('l=')[1];
      let lan: string;
      if (tempStr.indexOf('&') > -1) {
        lan = tempStr.split('&')[0].toLowerCase();
      } else {
        lan = tempStr.toLowerCase();
      }
      switch (lan) {
        case 'zh-tw':
        case 'zh-cn':
        case 'en-us':
        case 'es-es':
        case 'de-de':
        case 'fr-fr':
        case 'it-it':
        case 'pt-pt':
        case 'pt-br':
          return lan;
        default:
          return 'en-us';
      }
    } else {
      return 'en-us';
    }
  }

  /**
   * 根據點擊切換頁面
   * @param page {string}-點擊的頁面
   */
  switchPage(page: string) {
    this.activePage = page;
    this.uiFlag.page = page;
  }

  /**
   * 確認ui設定（隱藏導行列、暗黑模式等）
   * @author kidin-1101229
   */
  checkUiSetting() {
    combineLatest([
      this.globalEventsService.getHideNavbarStatus(),
      this.globalEventsService.getDarkModeStatus(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((result) => {
        const [rxHideNavbar, rxDarkMode] = result;
        const hideNavbarQuery = this.route.snapshot.queryParamMap.get('navbar') === '0';
        this.uiFlag.hideNavbar = hideNavbarQuery || rxHideNavbar;
        this.uiFlag.darkMode = rxDarkMode;
        const target = document.querySelector('body');
        if (rxDarkMode) {
          target.style.backgroundColor = 'black';
        } else {
          target.style.backgroundColor = 'white';
        }
      });
  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1091014
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

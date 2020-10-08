import { Component, OnInit } from '@angular/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
// import debounce from 'debounce';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../shared/services/utils.service';
import { DetectInappService } from '@shared/services/detect-inapp.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss']
})
export class PortalComponent implements OnInit {
  isMaskShow = false;
  isCollapseOpen = false;
  isEventTab: boolean;
  tabIdx = 0;
  isIntroducePage: boolean;
  isAlphaVersion = false;
  isPreviewMode = false;
  hideNavbar = false;  // 隱藏navbar-Kidin-1081023
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private globalEventsManager: GlobalEventsManager,
    private utilsService: UtilsService,
    public translateService: TranslateService,
    private detectInappService: DetectInappService,
    private dialog: MatDialog
  ) {
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

  }

  ngOnInit() {
    this.checkBrowser();
    this.checkHideNavabar();
    this.checkDomain();
    this.checkPage();
    this.checkLanguage();
    this.handleShowNavBar();
  }

  /**
   * 若非使用Line或其他App或IE以外瀏覽器時，跳出解析度警示框
   * @author Kidin-1081023
   */
  checkBrowser() {
    this.translateService.onLangChange.subscribe(() => {

      if (this.detectInappService.isIE) {
        if (this.detectInappService.isLine || this.detectInappService.isInApp) {
          if (location.search.length === 0) {
            location.href += '?openExternalBrowser=1';
          } else {
            location.href += '&openExternalBrowser=1';
          }
        } else {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: this.translateService.instant('universal_popUpMessage_browserError'),
              confirmText: this.translateService.instant('universal_operating_confirm')
            }
          });
        }
      }
    });

  }

  // 是否隱藏Header-Kidin-1081023
  checkHideNavabar () {
    let rxHideNavbar = false;
    this.utilsService.getHideNavbarStatus().subscribe(res => {
      rxHideNavbar = res;

      if (this.route.snapshot.queryParamMap.get('navbar') === '0'
        || rxHideNavbar
      ) {
        setTimeout(() => {  // 解決angular檢查前後狀態報錯的問題
          this.hideNavbar = true;
        }, 0);
      } else {
        setTimeout(() => {  // 解決angular檢查前後狀態報錯的問題
          this.hideNavbar = false;
        }, 0);

      }

    });

  }

  /**
   * 確認為正式或測試環境
   * @author kidin-1091008
   */
  checkDomain() {
    if (
      location.hostname.indexOf('cloud.alatech.com.tw') > -1
      || location.hostname.indexOf('www.gptfit.com') > -1
    ) {
      this.isAlphaVersion = false;
    } else {
      this.isAlphaVersion = true;
    }

  }

  /**
   * 確認現在頁面
   * @author kidin-1091008
   */
  checkPage() {
    if (
      this.router.url === '/' ||
      this.router.url === '/?openExternalBrowser=1' ||
      this.router.url === '/#connect' ||
      this.router.url === '/#cloudrun' ||
      this.router.url === '/#trainlive' ||
      this.router.url === '/#fitness'
    ) {
      this.isIntroducePage = true;
    } else {
      this.isIntroducePage = false;
    }

  }

  /**
   * 確認語言
   * @author kidin-1091008
   */
  checkLanguage() {
    let browserLang = this.utilsService.getLocalStorageObject('locale');
    if (!browserLang) {
      browserLang = this.translateService.getBrowserCultureLang().toLowerCase();
      const currentLocales = [
        'zh-tw',
        'zh-cn',
        'en-us',
        'es-es',
        'de-de',
        'fr-fr',
        'it-it',
        'pt-pt'
      ];  // 新增文件全語系-kidin-1090629
      if (currentLocales.findIndex(_locale => _locale === browserLang) === -1) {
        browserLang = 'en-us'; // default en-us
      }
      this.translateService.use(browserLang);
      this.utilsService.setLocalStorageObject('locale', browserLang);
    } else {
      this.translateService.use(browserLang);
    }

  }

  /**
   * 是否顯示NavBar
   * @author kidin-1091008
   */
  handleShowNavBar() {
    this.globalEventsManager.showNavBarEmitter.subscribe(mode => {
      this.isMaskShow = mode;
    });

  }
  
  /**
   * 遮罩顯示與否
   * @author kidin-1091008
   */
  touchMask() {
    this.isCollapseOpen = false;
    this.globalEventsManager.openCollapse(this.isCollapseOpen);
    this.isMaskShow = false;
    this.globalEventsManager.closeCollapse(false);
  }

}

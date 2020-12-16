import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
// import debounce from 'debounce';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../shared/services/utils.service';
import { DetectInappService } from '@shared/services/detect-inapp.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss']
})
export class PortalComponent implements OnInit, OnDestroy, AfterViewInit {

  private ngUnsubscribe = new Subject();

  @ViewChild('system_T1') systemT1: ElementRef;
  @ViewChild('system_T2') systemT2: ElementRef;
  @ViewChild('system_T3') systemT3: ElementRef;
  @ViewChild('system_T4') systemT4: ElementRef;
  @ViewChild('application_T1') applicationT1: ElementRef;
  @ViewChild('application_T2') applicationT2: ElementRef;
  @ViewChild('application_T3') applicationT3: ElementRef;
  @ViewChild('application_T4') applicationT4: ElementRef;
  @ViewChild('analysis_T1') analysisT1: ElementRef;
  @ViewChild('analysis_T2') analysisT2: ElementRef;
  @ViewChild('analysis_T3') analysisT3: ElementRef;
  @ViewChild('analysis_T4') analysisT4: ElementRef;

  uiFlag = {
    page: 'system'
  };

  isMaskShow = false;
  isCollapseOpen = false;
  isEventTab: boolean;
  tabIdx = 0;
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
    this.listenTargetImg();
    
  }

  ngAfterViewInit() {
    window.scrollTo({top: 0, behavior: 'auto'});
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
    switch (this.router.url) {
      case '/':
      case '/introduction/system':
        this.uiFlag.page = 'system';
        break;
      case '/?openExternalBrowser=1':
      case '/#connect':
      case '/#cloudrun':
      case '/#trainlive':
      case '/#fitness':
      case '/introduction/application':
        this.uiFlag.page = 'application';
        break;
      case '/introduction/analysis':
        this.uiFlag.page = 'analysis';
        break;
      default:
        this.uiFlag.page = 'other';
        break;
    }

  }

  /**
   * 確認語言
   * @author kidin-1091008
   */
  checkLanguage() {
    let browserLang: string;
    // 確認是否為android
    if ((window as any).android) {
      browserLang = this.utilsService.getLocalStorageObject('locale');
    } else {
      browserLang = navigator.language.toLowerCase();
    }

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

      if (browserLang === 'pt-br') {
        browserLang = 'pt-pt'; // 巴西語預設顯示葡萄牙語-kidin-1091203
      } else if (currentLocales.findIndex(_locale => _locale === browserLang) === -1) {
        browserLang = 'en-us'; // default en-us
      }

      this.translateService.use(browserLang);
      this.utilsService.setLocalStorageObject('locale', browserLang);
    } else {

      if (browserLang === 'pt-br') {
        browserLang = 'pt-pt'; // 巴西語預設顯示葡萄牙語-kidin-1091203
      }

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
   * 監聽該頁面圖片位置以產生動態css
   * @author kidin-1091014
   */
  listenTargetImg() {
      const scrollEvent = fromEvent(document, 'scroll');
      scrollEvent.pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(e => {
        this.slideImg();
      })
    
  }

  /**
   * 當頁面滾到指定位置，則圖片滑入
   * @author kidin-1091014
   */
  slideImg() {

    setTimeout(() => {
      let targetImg = [
        `${this.uiFlag.page}T1`,
        `${this.uiFlag.page}T2`,
        `${this.uiFlag.page}T3`,
        `${this.uiFlag.page}T4`
      ];

      targetImg.forEach(_img => {
        if (this[_img]) {

          const imgElement = this[_img].nativeElement;
          if (((window.innerHeight / 1.5) + window.pageYOffset) > imgElement.offsetTop) {

            switch (_img) {
              case 'systemT1':
              case 'applicationT4':
              case 'analysisT1':
                this.addClass(imgElement, 'left__slide__in');
                break;
              case 'systemT2':
              case 'systemT4':
              case 'analysisT2':
                this.addClass(imgElement, 'right__slide__in');
                break;
              default:
                this.addClass(imgElement, 'bottom__slide__in');
                break;
            }
            
          }

        }

      })

    })

  }

  /**
   * 確認元素是否有該class，若無則添加class
   * @param el {Element}
   * @param name {string}
   * @author kidin-1091014
   */
  addClass(el: Element, name: string) {
    let classList = el.className.split(' ');

    if (classList.indexOf('hide__slide__img') > -1) {
      classList = classList.filter(_class => _class !== 'hide__slide__img');
    }

    if (classList.indexOf(name) < 0) {
      classList.push(name); 
      el.className = classList.join(' ');
    }

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

  /**
   * 根據點擊切換頁面
   * @param e {string}-點擊的頁面
   * @author kidin-1091008
   */
  switchPage(e: string) {
    let url = `/introduction/${e}`;
    this.router.navigateByUrl(url);
    this.uiFlag.page = e;
    window.scrollTo({top: 0, behavior: 'auto'});
  }

  /**
   * 根據語系轉導至指定網址
   * @param code {number} 1: 了解更多 2:探索產品 3:取得應用 4:與我們聯絡
   * @author kidin-1091012
   */
  handleNavigation(code: number) {
    const currentLang = this.utilsService.getLocalStorageObject('locale');
    let lang: string;
    switch (currentLang) {
      case 'zh-tw':
        lang = 'tw';
        break;
      case 'zh-cn':
        lang = 'cn';
        break;
      default:
        lang = 'en';
        break;
    }

    switch (code) {
      case 1:
        window.open(`https://www.attacusfitness.com/gpt/lang/${lang}/id/38`, '_blank', 'noopener=yes,noreferrer=yes');
        break;
      case 2:
        window.open(`https://www.attacusfitness.com/products/${lang}/id/3`, '_blank', 'noopener=yes,noreferrer=yes');
        break;
      case 3:
        this.uiFlag.page = 'application';
        window.scrollTo({top: 0, behavior: 'smooth'});
        break;
      case 4:
        window.open(`https://www.attacusfitness.com/contact/lang/${lang}`, '_blank', 'noopener=yes,noreferrer=yes');
        break;
    }

  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1091014
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

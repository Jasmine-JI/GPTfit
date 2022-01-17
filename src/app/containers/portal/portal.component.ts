import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import { GlobalEventsManager } from '../../shared/global-events-manager';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../shared/services/utils.service';
import { DetectInappService } from '../../shared/services/detect-inapp.service';
import { fromEvent, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { langList } from '../../shared/models/i18n';

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
    page: 'system',
    isAlphaVersion: false,
    isPreviewMode: false,
    hideNavbar: false,
    isMaskShow: false,
    isCollapseOpen: false,
    darkMode: false
  };
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private globalEventsManager: GlobalEventsManager,
    private utilsService: UtilsService,
    public translateService: TranslateService,
    private detectInappService: DetectInappService
  ) {
    if (location.search.indexOf('ipm=s') > -1) {
      this.uiFlag.isPreviewMode = true;
    }

  }

  ngOnInit() {
    this.checkBrowser();
    this.checkDomain();
    this.checkPage();
    this.checkLanguage();
    this.handleShowNavBar();
    this.listenTargetImg();
  }

  ngAfterViewInit() {
    // 使用setTimeout處理ExpressionChangedAfterItHasBeenCheckedError報錯
    setTimeout(() => this.checkUiSetting());
    window.scrollTo({top: 0, behavior: 'auto'});
    this.checkLanguage();  // 因應手機平台，故在此生命週期再判斷一次語系
  }

  /**
   * 若非使用Line或其他App或IE以外瀏覽器時，跳出解析度警示框
   * @author Kidin-1081023
   */
  checkBrowser() {
    this.translateService.onLangChange.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.detectInappService.checkBrowser();
    });

  }

  /**
   * 確認ui設定（隱藏導行列、暗黑模式等）
   * @author kidin-1101229
   */
  checkUiSetting () {
    let rxHideNavbar = false;
    combineLatest([
      this.utilsService.getHideNavbarStatus(),
      this.utilsService.getDarkModeStatus()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(result => {
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
   * 確認為正式或測試環境
   * @author kidin-1091008
   */
  checkDomain() {
    this.uiFlag.isAlphaVersion = this.utilsService.checkWebVersion()[0];
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
      case '/introduction/application#connect':
      case '/introduction/application#cloudrun':
      case '/introduction/application#trainlive':
      case '/introduction/application#fitness':
      case '/introduction/application':
        this.uiFlag.page = 'application';
        this.clearAppViewSet();
        break;
      case '/introduction/analysis':
        this.uiFlag.page = 'analysis';
        this.clearAppViewSet();
        break;
      default:
        this.uiFlag.page = 'other';
        break;
    }

  }

  /**
   * 移除appview變更之設定
   * @author kidin-1110114
   */
  clearAppViewSet() {
    this.utilsService.setHideNavbarStatus(false);
    this.utilsService.setDarkModeStatus(false);
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
      browserLang = this.utilsService.getLocalStorageObject('locale') || navigator.language.toLowerCase();
    }

    if (browserLang === 'pt-br') {
      browserLang = 'pt-pt'; // 巴西語預設顯示葡萄牙語-kidin-1091203
    } else if (langList.findIndex(_locale => _locale === browserLang) === -1) {
      browserLang = 'en-us'; // default en-us
    }

    this.translateService.use(browserLang);
    this.utilsService.setLocalStorageObject('locale', browserLang);
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
   * 是否顯示NavBar
   * @author kidin-1091008
   */
  handleShowNavBar() {
    this.globalEventsManager.showNavBarEmitter.subscribe(mode => {
      this.uiFlag.isMaskShow = mode;
    });

  }

  /**
   * 監聽該頁面圖片位置以產生動態css
   * @author kidin-1091014
   */
  listenTargetImg() {
    const mainSection = document.querySelector('.main'),
          scrollEvent = fromEvent(mainSection, 'scroll');

    scrollEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.slideImg((e as any).target.scrollTop);
    })
    
  }

  /**
   * 當頁面滾到指定位置，則圖片滑入
   * @param scrollTop {number}-距離頂端的捲動高度
   * @author kidin-1091014
   */
  slideImg(scrollTop: number) {

    setTimeout(() => {
      let targetImg = [
        `${this.uiFlag.page}T1`,
        `${this.uiFlag.page}T2`,
        `${this.uiFlag.page}T3`,
        `${this.uiFlag.page}T4`
      ];

      targetImg.forEach(_img => {
        const imgElement = document.getElementById(_img);
        if (imgElement) {
          
          if (scrollTop + (window.innerHeight * 2 / 3) >= imgElement.offsetTop) {

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
    this.uiFlag.isCollapseOpen = false;
    this.globalEventsManager.openCollapse(this.uiFlag.isCollapseOpen);
    this.uiFlag.isMaskShow = false;
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

    setTimeout(() => {
      this.listenTargetImg();
    })
    
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
        this.switchPage('application');
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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UtilsService } from '../../shared/services/utils.service';
import { UserProfileService } from '../../shared/services/user-profile.service';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserProfileInfo } from '../dashboard/models/userProfileInfo';
import { OfficialActivityService } from './services/official-activity.service';
import { AuthService } from '../../shared/services/auth.service';
import { DetectInappService } from '../../shared/services/detect-inapp.service';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { CloudrunService } from '../../shared/services/cloudrun.service';
import { SignTypeEnum } from '../../shared/models/utils-type';


type Page =
    'activity-list'
  | 'my-activity'
  | 'activity-detail'
  | 'apply-activity'
  | 'leaderboard'
  | 'contestant-list'
  | 'edit-activity';

enum PageCode {
  'activity-list',
  'leaderboard',
  'my-activity'
}

@Component({
  selector: 'app-official-activity',
  templateUrl: './official-activity.component.html',
  styleUrls: ['./official-activity.component.scss']
})
export class OfficialActivityComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private pageResize = new Subscription;
  private globleEventSubscription = new Subscription;

  /**
   * ui 會用到的各個flag
   */
  uiFlag = {
    currentPage: <Page>'activity-list',
    isMobile: false,
    currentAdvertiseId: 1,
    showAdvertise: true,
    showSearchInput: false,
    showEntryMenu: false
  };

  userInfo: UserProfileInfo;
  token = this.utils.getToken() || '';
  advertise = [];
  carousel: { img: string; advertiseId: number; link: string; };
  carouselProgress: any;
  carouselWidth = 840;
  carouselAnimation: any;

  constructor(
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private router: Router,
    private officialActivityService: OfficialActivityService,
    private auth: AuthService,
    private detectInappService: DetectInappService,
    private translateService: TranslateService,
    private cloudrunService: CloudrunService
  ) { }

  ngOnInit(): void {
    this.utils.checkBrowserLang();
    this.detectParamChange();
    this.checkScreenSize();
    this.checkCurrentPage();
    this.handlePageResize();
    this.loginCheck();
    this.getEventAdvertise();
    this.getCloudrunMapInfo();
  }

  /**
   * 訂閱語言改變事件
   * @author kidin
   */
  checkBrowser() {
    this.translateService.onLangChange.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      this.detectInappService.checkBrowser();
    });

  }

  /**
   * 處理url param改變的事件
   * @author kidin-1091110
   */
  detectParamChange() {
    this.router.events.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(event => {

      if (event instanceof NavigationEnd) {
        this.checkCurrentPage();
      }

    })

  }

  /**
   * 確認現在頁面
   * @author kidin-1101004
   */
  checkCurrentPage() {
    const { pathname } = location,
          [, mainPath, childPath, ...rest] = pathname.split('/');
    if (childPath) {
      const childPage = childPath as Page;
      this.uiFlag.currentPage = childPage;
      this.uiFlag.showAdvertise = [
        'activity-list',
        'my-activity',
        'leaderboard'
      ].includes(childPath);

      if (!this.uiFlag.isMobile) this.checkPageUnderlinePosition(childPage);
    }

    if (this.uiFlag.showAdvertise) {
      this.startCarousel();
    } else {
      this.stopCarousel();
    }
    
  }

  /**
   * 確認所在頁面，調整頁面提示底線的位置
   * @param page {Page}-現在所在頁面
   * @author kidin-1101008
   */
  checkPageUnderlinePosition(page: Page) {
    setTimeout(() => {
      const targetEntryIndex = PageCode[page],
            linkActiveUnderline = document.getElementById('link__active') as any;
      if (targetEntryIndex !== undefined) {
          const pageEntryElement = document.querySelector('.child__page__entry'),
                pageLinkElement = document.querySelectorAll('.child__page__link');
          if (pageEntryElement && pageLinkElement) {
            const targetEntryIndex = PageCode[page],
                  targetEntry = pageLinkElement[targetEntryIndex],
                  entryXPosition = pageEntryElement.getBoundingClientRect().x,
                  { width, x } = targetEntry.getBoundingClientRect();
            linkActiveUnderline.style.width = `${width}px`;
            linkActiveUnderline.style.left = `${x - entryXPosition}px`;
          }

      } else {

        if (linkActiveUnderline) linkActiveUnderline.style.width = '0px';

      }

    });

  }

  /**
   * 偵測瀏覽器是否改變大小
   * @author kidin-1100928
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    this.pageResize = page.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.checkScreenSize();
      this.unsubscribePluralEvent();
    });

  }

  /**
   * 確認現在視窗大小
   * @author kidin-1100928
   */
  checkScreenSize() {
    const { innerWidth } = window;
    if (innerWidth <= 767) {
      this.uiFlag.isMobile = true;
    } else {
      this.uiFlag.isMobile = false;
      this.checkPageUnderlinePosition(this.uiFlag.currentPage);
    }

    this.officialActivityService.setScreenSize(innerWidth);
    const { showAdvertise } = this.uiFlag;
    if (showAdvertise) {
      this.handleAdvertiseSize(innerWidth);
    }

  }

  /**
   * 根據螢幕大小設定輪播尺寸
   * @param innerWidth {number}-螢幕寬度
   * @author kidin-1101005
   */
  handleAdvertiseSize(innerWidth: number) {
    const { isMobile } = this.uiFlag,
          advertiseElement = document.querySelectorAll('.carousel__block')[0] as any,
          advertiseImg = document.querySelectorAll('.carousel__img'),
          totalOtherWidth = isMobile ? 120 : 330;
    if (advertiseElement) {
      const widthCount = innerWidth - totalOtherWidth;
      this.carouselWidth = widthCount > 840 ? 840 : widthCount;
      (advertiseElement).style.width = `${this.carouselWidth}px`;
      advertiseImg.forEach(_adImg => {
        (_adImg as any).style.width = `${this.carouselWidth}px`;
      });

    } else {
      setTimeout(() => {
        this.handleAdvertiseSize(innerWidth);
      });
      
    }

  }

  /**
   * 如有登入，則取得使用者userProfile
   * @author kidin-1100928
   */
  loginCheck() {
    if (this.token) {
      const body = {
        token: this.token,
        signInType: SignTypeEnum.token
      };

      this.auth.loginCheck(body).subscribe(res => {
        const [userProfile, accessRight] = res;
        this.userInfo = 
          this.userProfileService.userProfileCombineAccessRight(userProfile, accessRight);
      });

    }

  }

  /**
   * 取得輪播內容
   * @author kidin-1101004
   */
  getEventAdvertise() {
    const body = {
      token: this.token
    };

    this.officialActivityService.getEventAdvertise(body).subscribe(res => {
console.log('get ad', res);
      if (this.utils.checkRes(res)) {
        const { advertise } = res,
              currentTimestamp = moment().unix();
        this.advertise = advertise.filter(_ad => _ad.effectDate > currentTimestamp);
        const { showAdvertise } = this.uiFlag,
              advertiseLength = this.advertise.length,
              haveAdvertise = advertiseLength > 0,
              switchAdvertise = advertiseLength > 1;
        if (showAdvertise && haveAdvertise) {
          this.handleAdvertiseSize(innerWidth);
          if (switchAdvertise) this.startCarousel();
        }

      }

    });

  }

  /**
   * 開始進行輪播
   * @author kidin-1101006
   */
  startCarousel() {
    const { advertise, uiFlag } = this;
    if (advertise && advertise.length > 0) {
      const { currentAdvertiseId } = uiFlag,
            { img, advertiseId, link } = advertise[currentAdvertiseId - 1];
      this.carousel = {
        advertiseId,
        img,
        link
      };

      this.carouselProgress = setInterval(() => {
        this.switchNextCarousel();
      }, 7000);

    }

  }

  /**
   * 停止輪播
   * @author kidin-1101028
   */
  stopCarousel() {
    if (this.carouselProgress) clearInterval(this.carouselProgress);
    if (this.carouselAnimation) clearInterval(this.carouselAnimation);
  }

  /**
   * 切換下一張輪播
   * @author kidin-1101005
   */
  switchNextCarousel() {
    if (!this.carouselAnimation) {
      const { currentAdvertiseId } = this.uiFlag,
            advertiseLen = this.advertise.length;
      if (currentAdvertiseId + 1 > advertiseLen) {
        this.uiFlag.currentAdvertiseId = 1;
      } else {
        this.uiFlag.currentAdvertiseId++;
      }

      this.carouselPlay('next');
    }

  }

  /**
   * 切換前一張輪播
   * @author kidin-1101005
   */
  switchPreCarousel() {
    if (!this.carouselAnimation) {
      const { currentAdvertiseId } = this.uiFlag,
            advertiseLen = this.advertise.length;
      if (currentAdvertiseId - 1 < 1) {
        this.uiFlag.currentAdvertiseId = advertiseLen;
      } else {
        this.uiFlag.currentAdvertiseId--;
      }

      this.carouselPlay('pre');
    }

  }

  /**
   * 輪播切換
   * @param action {'next' | 'pre'}-播放方向
   * @author kidin-1101015
   */
  carouselPlay(action: 'next' | 'pre') {
    const { currentAdvertiseId } = this.uiFlag,
          { img, link } = this.advertise[currentAdvertiseId - 1],
          carouselList = document.querySelectorAll('.carousel__list')[0] as any,
          switchCarousel = document.createElement('li');
    switchCarousel.classList.add('carousel__list__item');
    switchCarousel.innerHTML = `
      <a href="${link}" target="_blank">
        <img src="${img}" alt="ad" class="carousel__img" style="width: ${this.carouselWidth}px;">
      </a>
    `;

    if (action === 'pre') {
      carouselList.insertBefore(switchCarousel, carouselList.firstChild);
      carouselList.style.left = `${-this.carouselWidth}px`;
    } else {
      carouselList.appendChild(switchCarousel);
    }
    
    const animatoinTotalTime = 500,
          oneShiftTime = 10;
    let timeCount = 0;
    this.carouselAnimation = setInterval(() => {
      if (timeCount > animatoinTotalTime) {
        const itemList = document.querySelectorAll('.carousel__list__item'),
              removeIndex = action === 'pre' ? itemList.length - 1 : 0,
              removeTargetElement = itemList[removeIndex];
        removeTargetElement.parentNode.removeChild(removeTargetElement);
        carouselList.style.left = 0;
        clearInterval(this.carouselAnimation);
        this.carouselAnimation = undefined;
      } else {
        const ratio = timeCount / animatoinTotalTime,
              shiftRatio = action === 'pre' ? 1 - ratio : ratio;
        carouselList.style.left = `${-this.carouselWidth * shiftRatio}px`;
      }

      timeCount += oneShiftTime;
    }, oneShiftTime);

  }

  /**
   * 取得雲跑地圖資訊並儲存
   * @author kidin-1101007
   */
  getCloudrunMapInfo() {
    this.cloudrunService.getAllMapInfo().subscribe(res => {
console.log('map info', res);
      if (this.utils.checkRes) {
        this.officialActivityService.saveAllMapInfo(res.list);
      };

    });

  }

  /**
   * 轉導至指定頁面
   * @param e {MouseEvent}
   * @param path {string}-指定路徑
   * @author kidin-1101004
   */
  navigate(e: MouseEvent, path: string) {
    if (e) e.preventDefault();
    this.router.navigateByUrl(path);
  }

  /**
   * 顯示搜尋輸入框
   * @author kidin-1101014
   */
  showSearchInput() {
    this.uiFlag.showSearchInput = true;
    const inputElement = document.getElementById('search__input');
    inputElement.focus();
  }

  /**
   * 隱藏搜尋輸入框
   * @author kidin-1101014
   */
  hideSearchInput() {
    this.uiFlag.showSearchInput = false;
    const inputElement = document.getElementById('search__input') as any;
    inputElement.value = '';
  }

  /**
   * 手機模式顯示子頁面入口選單
   * @param e {MouseEvent}
   * @author kidin-1101014
   */
  showEntryMenu(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showEntryMenu = true;
    this.subscribePluralEvent();
  }

  /**
   * 訂閱全域點擊事件
   * @author kidin-1101014
   */
  subscribePluralEvent() {
    const scrollElement = document.getElementById('main__page'),
          clickEvent = fromEvent(document, 'click'),
          scrollEvent = fromEvent(scrollElement, 'scroll');
    this.globleEventSubscription = merge(clickEvent, scrollEvent).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.unsubscribePluralEvent();
    });

  }

  /**
   * 隱藏選單並取消訂閱全域點擊事件
   * @author kidin-1101014
   */
  unsubscribePluralEvent() {
    this.uiFlag.showEntryMenu = false;
    this.globleEventSubscription.unsubscribe();
  }

  /**
   * 解除rxjs訂閱和計時器
   */
  ngOnDestroy() {
    this.stopCarousel();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

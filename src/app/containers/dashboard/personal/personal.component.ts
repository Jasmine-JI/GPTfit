import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterContentInit,
  HostListener,
} from '@angular/core';
import { UserProfile } from '../../../core/models/api/api-10xx';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { Router, ActivatedRoute, NavigationEnd, RouterOutlet } from '@angular/router';
import { EditMode } from '../models/personal';
import { AlbumType } from '../../../core/enums/api';
import { DashboardService } from '../services/dashboard.service';
import {
  GlobalEventsService,
  HashIdService,
  UserService,
  AuthService,
  HintDialogService,
} from '../../../core/services';
import { v5 as uuidv5 } from 'uuid';
import dayjs from 'dayjs';
import { ImageUploadService } from '../services/image-upload.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { getUrlQueryStrings, base64ToFile } from '../../../core/utils';
import { appPath } from '../../../app-path.const';
import { QueryString, Domain } from '../../../core/enums/common';
import { ShareBoxComponent } from '../../../components/share-box/share-box.component';
import { ImgCropperComponent } from '../../../components/image-cropper/image-cropper.component';
import { SettingAccountComponent } from './setting-account/setting-account.component';
import { SettingPreferComponent } from './setting-prefer/setting-prefer.component';
import { SettingPrivacyComponent } from './setting-privacy/setting-privacy.component';
import { SettingBaseComponent } from './setting-base/setting-base.component';
import { LoadingIconComponent } from '../../../shared/components/loading-icon/loading-icon.component';
import { NgIf, NgFor, NgTemplateOutlet, CommonModule } from '@angular/common';
import * as Hammer from 'hammerjs';

type ImgType = 'icon' | 'scenery';

@Component({
  selector: 'app-personal',
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    LoadingIconComponent,
    NgFor,
    NgTemplateOutlet,
    RouterOutlet,
    SettingBaseComponent,
    SettingPrivacyComponent,
    SettingPreferComponent,
    SettingAccountComponent,
    ImgCropperComponent,
    ShareBoxComponent,
    TranslateModule,
  ],
})
export class PersonalComponent implements OnInit, AfterContentInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  pageResize: Subscription;
  clickEvent: Subscription;
  scrollEvent: Subscription;

  @ViewChild('navSection') navSection: ElementRef;
  @ViewChild('pageListBar') pageListBar: ElementRef;
  @ViewChild('seeMore') seeMore: ElementRef;
  @ViewChild('headerDescription') headerDescription: ElementRef;

  /**
   * ui 會用到的各個flag
   */
  uiFlag = {
    isLoading: false,
    isPortalMode: false,
    isPageOwner: false,
    currentPage: appPath.personal.activityList,
    editMode: <EditMode>'edit',
    descOverflow: false,
    showMorePageOpt: false,
    isPreviewMode: false,
    openImgSelector: <ImgType | null>null,
    divideIndex: <number | null>99,
    currentTagIndex: 0,
    barPosition: 0,
    barWidth: 0,
    windowInnerWidth: <number | null>null,
    hideScenery: false,
    isSettingPage: false,
    patchEditPrivacy: false,
    displayShareBox: false,
    scrollUp: false,
    fixed: false,
  };

  /**
   * 管理編輯頭像或佈景
   */
  editImage = {
    edited: false,
    icon: {
      origin: <string | null>null,
      base64: <string | null>null,
    },
    scenery: {
      origin: <string | null>null,
      base64: <string | null>null,
    },
  };

  /**
   * 儲存子頁面清單各選項按鈕寬度
   */
  perPageOptSize = {
    total: 0,
    perSize: <Array<number>>[],
  };

  /**
   * 分享框顯示內容
   */
  share = {
    title: '',
    link: '',
  };

  userProfile: UserProfile;
  hashUserId: string;
  token = this.authService.token;
  childPageList: Array<string> = [];

  readonly AlbumType = AlbumType;
  readonly personalPage = appPath.personal;

  constructor(
    private hintDialogService: HintDialogService,
    private route: ActivatedRoute,
    private router: Router,
    private hashIdService: HashIdService,
    private globalEventsService: GlobalEventsService,
    private dashboardService: DashboardService,
    private imageUploadService: ImageUploadService,
    private translate: TranslateService,
    private usreService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkPage();
    this.checkQueryString();
    this.handlePageResize();
    this.handleLanguageChange();
    if (!this.uiFlag.isPreviewMode) this.handleScroll();
    this.getNeedInfo();
    this.detectParamChange();
    if (!this.uiFlag.isPortalMode) this.handleSideBarSwitch();
    this.checkEditMode();
  }

  ngAfterContentInit(): void {
    this.checkScreenSize();
  }

  /**
   * 確認是否為預覽列印頁面
   * @author kidin-1100812
   */
  checkPage() {
    const { pathname } = location;
    const [, mainPath, secondPath, thirdPath] = pathname.split('/');
    const { dashboard, personal } = appPath;
    switch (mainPath) {
      case dashboard.home: {
        const isSettingPath = secondPath === personal.userSettings;
        const redirectUrl = personal.stravaRedirectSettings; // strava轉導回GPTfit
        const isStravaRedirectPath = `${secondPath}/${thirdPath}` === redirectUrl; // strava轉導回GPTfit
        this.uiFlag.isSettingPage = isSettingPath || isStravaRedirectPath;
        this.uiFlag.isPortalMode = false;
        break;
      }
      case personal.home: {
        this.handleNotDashBoardPage();
        this.checkPageOwner(thirdPath);
        break;
      }
      default:
        this.handleNotDashBoardPage();
        break;
    }
  }

  /**
   * 確認目前頁面擁有者是否為自己
   * @param thirdPath 第三個路徑名稱
   */
  checkPageOwner(thirdPath: string) {
    const userId = this.usreService.getUser().userId;
    const targetUserId = this.getPageOwnerId();
    if (targetUserId === userId) {
      const { dashboard, personal } = appPath;
      if (!thirdPath) {
        return this.router.navigateByUrl(`/${dashboard.home}/${personal.activityList}`);
      }

      const { search } = location;
      const redirectPath = `/${dashboard.home}/${thirdPath}${search}`;
      return this.router.navigateByUrl(redirectPath);
    }
  }

  /**
   * 取得頁面持有人編號
   */
  getPageOwnerId() {
    const { personal } = appPath;
    this.hashUserId = this.route.snapshot.paramMap.get(personal.userId) as string;
    return +this.hashIdService.handleUserIdDecode(this.hashUserId);
  }

  /**
   * 確認網址參數
   */
  checkQueryString() {
    const query = getUrlQueryStrings(location.search);
    if (query.ipm) this.uiFlag.isPreviewMode = true;
  }

  /**
   * 處理非dashboard頁面之狀態
   */
  handleNotDashBoardPage() {
    this.uiFlag.isSettingPage = false;
    this.uiFlag.isPortalMode = true;
  }

  /**
   * 偵測瀏覽器是否改變大小
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    this.pageResize = page
      .pipe(
        switchMap((res) => this.globalEventsService.getRxSideBarMode().pipe(map((resp) => res))),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(() => {
        this.checkScreenSize();
      });
  }

  /**
   * 偵測語言改變事件
   */
  handleLanguageChange() {
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.getPerPageOptSize();
    });
  }

  /**
   * 監聽捲動事件，當捲動到tab時，tab固定置頂
   */
  handleScroll() {
    const targetElement = document.querySelectorAll('.main__container');
    const targetScrollEvent = fromEvent(targetElement, 'scroll');
    this.scrollEvent = targetScrollEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.checkPageListBarPosition();
    });
  }

  private timer: any; // 保存計時器的引用
  @HostListener('window:mousewheel', ['$event'])
  IfscrollUp(e: WheelEvent) {
    this.uiFlag.scrollUp = e.deltaY < 0 ? true : false;
  }

  // @HostListener('window:swipe', ['$event'])
  // IfswipeUp(){
  //   const hammer = new Hammer(document.body);
  // hammer.on('swipe', (event: any) => {
  //   // event.direction 可能的值為 2（向上）或 8（向下）
  //   if (event.direction === Hammer.DIRECTION_UP) {
  //     console.log('向上滑動');
  //     // 在這裡執行相應的邏輯
  //   } else if (event.direction === Hammer.DIRECTION_DOWN) {
  //     console.log('向下滑動');
  //     // 在這裡執行相應的邏輯
  //   }
  // });
  // }

  /**
   * 確認tab位置與寬度
   */
  checkPageListBarPosition() {
    if (!this.uiFlag.isSettingPage) {
      const pageListBar = document.querySelectorAll('.info-pageListBar')[0] as any;
      const headerDescription = document.querySelectorAll('.info-headerDescription')[0];
      const scenerySection = document.querySelectorAll('.info-scenerySection')[0];
      // const headerDescriptionBlock = document.querySelectorAll('.info-headerDescriptionBlock')[0];
      if (pageListBar && headerDescription && scenerySection) {
        const { top: barTop } = pageListBar.getBoundingClientRect();
        const { bottom: descBottom } = headerDescription.getBoundingClientRect();
        // const { width } = scenerySection.getBoundingClientRect();
        if (barTop <= 61 && descBottom < 60) {
          // 超過bar位置
          if (this.uiFlag.scrollUp && !this.uiFlag.fixed) {
            //往上出現
            pageListBar.classList.remove('info-pageListBar-nofixed');
            pageListBar.classList.add('info-pageListBar-fixed');
            this.uiFlag.fixed = true;
          } else if (!this.uiFlag.scrollUp && this.uiFlag.fixed) {
            //往下消失
            pageListBar.classList.add('info-pageListBar-nofixed');
            this.uiFlag.fixed = false;
          } else if (this.uiFlag.scrollUp && this.uiFlag.fixed) {
            // 設置新的計時器，5秒後執行隱藏bar
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
              pageListBar.classList.add('info-pageListBar-nofixed');
              this.uiFlag.fixed = false;
            }, 3000);
          }
        } else {
          pageListBar.classList.remove('info-pageListBar-fixed');
          pageListBar.classList.remove('info-pageListBar-nofixed');
          this.uiFlag.fixed = false;
        }
      }
      if (this.uiFlag.isPortalMode) {
        pageListBar.style.left = 0;
        pageListBar.style.right = 0;
      }
    }
  }

  /**
   * 當sidebar模式變更時，重新計算active bar位置
   */
  handleSideBarSwitch() {
    this.globalEventsService
      .getRxSideBarMode()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        setTimeout(() => {
          this.checkScreenSize();
        }, 250); // 待sidebar動畫結束再計算位置
      });
  }

  /**
   * 當進入編輯或建立群組模式時，讓佈景或圖片進入可編輯模式
   */
  checkEditMode() {
    this.dashboardService
      .getRxEditMode()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.upLoadImg(res);
        this.uiFlag.openImgSelector = null;
      });
  }

  /**
   * 依瀏覽器大小將超出邊界的清單進行收納
   */
  checkScreenSize() {
    // 確認多國語系載入後再計算按鈕位置
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        const navSection = this.navSection?.nativeElement;
        if (navSection) {
          const navSectionWidth = navSection.clientWidth;
          let reservedSpace = 0;
          this.uiFlag.windowInnerWidth = window.innerWidth;
          const haveExpandSidebar = window.innerWidth >= 1000 && window.innerWidth <= 1390;
          if (haveExpandSidebar && !this.uiFlag.isPortalMode) {
            reservedSpace = 270; // sidebar展開所需的空間
          }

          const { total, perSize } = this.perPageOptSize;
          if (navSectionWidth < total + reservedSpace) {
            const titleSizeList = perSize;
            let total = 0;
            for (let i = 0, sizeArrLen = titleSizeList.length; i < sizeArrLen; i++) {
              total += titleSizeList[i];
              if (total + reservedSpace + 130 >= navSectionWidth) {
                // 130為"更多"按鈕的空間
                this.uiFlag.divideIndex = i;
                break;
              }
            }

            this.handleGlobalClick();
          } else {
            this.uiFlag.divideIndex = null;
            if (this.clickEvent) {
              this.clickEvent.unsubscribe();
            }
          }

          setTimeout(() => {
            this.getBtnPosition(this.uiFlag.currentTagIndex);
            this.checkPageListBarPosition();
          }, 250); // 待sidebar動畫結束再計算位置
        }
      });
  }

  /**
   * 偵測全域點擊事件，以收納"更多"選單
   */
  handleGlobalClick() {
    const clickEvent = fromEvent(document, 'click');
    this.clickEvent = clickEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.uiFlag.showMorePageOpt = false;
    });
  }

  /**
   * 取得頁面所需資訊
   */
  getNeedInfo() {
    this.uiFlag.isLoading = true;
    if (this.uiFlag.isPortalMode) {
      this.getAssignUserProfile();
    } else {
      this.uiFlag.isPageOwner = true;
      this.getRxUserProfile();
    }
  }

  /**
   * 取得指定該頁面使用者資訊，並確認是否與登入者為同一人
   */
  getAssignUserProfile() {
    const userId = this.getPageOwnerId();
    this.usreService.getTargetUserInfo(userId).subscribe((res) => {
      this.uiFlag.isPageOwner = userId === res.userId;
      this.userProfile = res;
      this.checkDescLen();

      this.childPageList = this.initChildPageList();
      this.getCurrentContentPage();
      this.getPerPageOptSize();
      this.uiFlag.isLoading = false;
    });
  }

  /**
   * 取得登入者資訊
   */
  getRxUserProfile() {
    this.usreService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.uiFlag.hideScenery = false;
        this.userProfile = res;
        this.hashUserId = this.hashIdService.handleUserIdEncode(res.userId);
        this.childPageList = this.initChildPageList();
        this.getCurrentContentPage();
        this.getPerPageOptSize();
        this.uiFlag.isLoading = false;
        this.checkDescLen();
      });
  }

  /**
   * 根據登入前後頁面，顯示可點選之子頁面
   */
  initChildPageList(): Array<string> {
    if (!this.uiFlag.isSettingPage) {
      let childPageList = this.childPageList;
      const { isPortalMode, isSettingPage } = this.uiFlag;
      const { personal } = appPath;
      if (!isPortalMode) {
        if (!isSettingPage) {
          childPageList = [
            personal.activityList,
            personal.sportsReport,
            personal.exerciseHabits, //531,
            personal.lifeTracking,
            personal.cloudrun,
            personal.info,
          ];
        }
      } else {
        childPageList = [
          personal.activityList,
          personal.sportsReport,
          personal.exerciseHabits, //531
          personal.info,
        ];
      }

      return childPageList;
    } else {
      return [];
    }
  }

  /**
   * 取得子頁面清單各選項按鈕寬度
   */
  getPerPageOptSize() {
    if (!this.uiFlag.isSettingPage) {
      this.uiFlag.divideIndex = null;
      if (this.clickEvent) {
        this.clickEvent.unsubscribe();
      }

      setTimeout(() => {
        this.initPageOptSize();
        const menuList = document.querySelectorAll('.main__page__list');
        if (menuList[0]) {
          this.uiFlag.barWidth = menuList[0].clientWidth;
          menuList.forEach((_menu) => {
            this.perPageOptSize.perSize.push(_menu.clientWidth);
            this.perPageOptSize.total += _menu.clientWidth;
          });

          this.checkScreenSize();
        }
      });
    }
  }

  /**
   * 將perPageOptSize參數進行初始化
   */
  initPageOptSize() {
    this.uiFlag.divideIndex = null;
    if (this.clickEvent) {
      this.clickEvent.unsubscribe();
    }

    this.perPageOptSize = {
      total: 0,
      perSize: [],
    };
  }

  /**
   * 處理url param改變的事件
   */
  detectParamChange() {
    this.router.events.pipe(takeUntil(this.ngUnsubscribe)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.getCurrentContentPage(event);
        this.getBtnPosition(this.uiFlag.currentTagIndex);
      }
    });
  }

  /**
   * 根據url對應選單
   * @param event {NavigationStart}-變更url產生的事件
   */
  getCurrentContentPage(event: any = null): void {
    if (!this.uiFlag.isSettingPage) {
      let urlArr: Array<string>;
      const { isPortalMode } = this.uiFlag;
      if (event !== null) {
        urlArr = event.url.split('/');
      } else {
        urlArr = location.pathname.split('/');
      }

      if (isPortalMode && urlArr.length < 4) {
        this.uiFlag.currentPage = appPath.personal.activityList;
        this.uiFlag.currentTagIndex = 0;
      } else {
        this.uiFlag.currentPage = urlArr[urlArr.length - 1].split('?')[0];
        this.uiFlag.currentTagIndex = this.childPageList.indexOf(this.uiFlag.currentPage);
      }
    }
  }

  /**
   * 確認個人介紹是否過長
   */
  checkDescLen() {
    if (!this.uiFlag.isSettingPage) {
      setTimeout(() => {
        const descSection = this.headerDescription.nativeElement;
        const descStyle = window.getComputedStyle(descSection, null);
        const descLineHeight = +descStyle.lineHeight.split('px')[0];
        const descHeight = +descStyle.height.split('px')[0];
        if (descHeight / descLineHeight > 2) {
          this.uiFlag.descOverflow = true;
        } else {
          this.uiFlag.descOverflow = false;
        }
      });
    }
  }

  /**
   * 開啟圖片選擇器
   * @param img {ImgType}-圖片類別（頭像/佈景）
   */
  openImgSelector(img: ImgType) {
    this.uiFlag.openImgSelector = img;
  }

  /**
   * 關閉圖片選擇器
   * @param e {any}
   */
  closeSelector(e: any) {
    const { albumType: uploadType, origin, base64 } = e.img;
    if (e.action === 'complete') {
      this.editImage.edited = true;
      if (uploadType === AlbumType.personalIcon) {
        this.editImage.icon.origin = origin;
        this.editImage.icon.base64 = base64;
      } else {
        this.editImage.scenery.origin = origin;
        this.editImage.scenery.base64 = base64;
        this.uiFlag.hideScenery = false;
      }

      this.upLoadImg('complete');
    }

    this.uiFlag.openImgSelector = null;
  }

  /**
   * 若編輯模式為complete，則上傳圖片
   * @param editMode {EditMode}-編輯模式
   */
  upLoadImg(editMode: EditMode) {
    const { edited, icon, scenery } = this.editImage;
    if (editMode === 'complete' && edited) {
      const imgArr: any = [];
      const formData = new FormData();
      const { userId } = this.userProfile;
      formData.set('token', this.authService.token);
      formData.set('targetType', '1');
      // 個人icon
      if (icon.base64 !== null) {
        const fileName = this.createFileName(imgArr.length, `${userId}`);
        imgArr.unshift({ albumType: AlbumType.personalIcon, fileNameFull: `${fileName}.jpg` });
        formData.append('file', base64ToFile(icon.base64, fileName));
      }

      // 個人佈景
      if (scenery.base64 !== null) {
        const fileName = this.createFileName(imgArr.length, `${userId}`);
        imgArr.unshift({ albumType: AlbumType.personalScenery, fileNameFull: `${fileName}.jpg` });
        formData.append('file', base64ToFile(scenery.base64, fileName));
      }

      formData.set('img', JSON.stringify(imgArr));
      this.sendImgUploadReq(formData);
    } else if (editMode === 'complete') {
      this.usreService.refreshUserProfile();
      // this.dashboardService.setRxEditMode('close');
    } else {
      this.uiFlag.editMode = editMode;
    }
  }

  /**
   * 送出api 8001
   * @param formData {FormData}-api所需資料
   * @param groupId {string}-group id
   */
  sendImgUploadReq(formData: FormData) {
    this.imageUploadService.addImg(formData).subscribe((res) => {
      const { resultCode } = res.processResult ?? { resultCode: 400 };
      if (resultCode !== 200) {
        this.editImage.icon.base64 = null;
        this.editImage.scenery.base64 = null;
        this.hintDialogService.openAlert('Image upload error.<br>Please change image.');
      } else {
        this.initImgSetting();
        this.usreService.refreshUserProfile();
        // this.dashboardService.setRxEditMode('close');
      }
    });
  }

  /**
   * 建立圖片名稱
   * @param length {number}-檔案索引
   * @param userId {string}-使用者id
   */
  createFileName(length: number, userId: string) {
    const nameSpace = uuidv5(`https://${Domain.newProd}`, uuidv5.URL),
      keyword = `${dayjs().valueOf().toString()}${length}${userId.split('-').join('')}`;
    return uuidv5(keyword, nameSpace);
  }

  /**
   * 將圖片設定初始化
   * @author kidin-1091201
   */
  initImgSetting() {
    this.editImage = {
      edited: false,
      icon: {
        origin: null,
        base64: null,
      },
      scenery: {
        origin: null,
        base64: null,
      },
    };
  }

  /**
   * 開啟分享框
   */
  openSharePersonalPage() {
    const { personal } = appPath;
    this.share = {
      title: this.userProfile.nickname || '',
      link: `${location.origin}/${personal.home}/${this.hashUserId}`,
    };

    this.uiFlag.displayShareBox = true;
  }

  /**
   * 關閉分享框
   */
  closeSharedBox() {
    this.uiFlag.displayShareBox = false;
  }

  /**
   * 根據使用者點選的頁面顯示內容
   * @param e {MouseEvent}
   * @param page {string}-子頁面
   * @param tagIdx {number}-tag的顯示序
   */
  handleShowContent(e: MouseEvent | null, page: string, tagIdx: number) {
    const { isPortalMode } = this.uiFlag;
    const { dashboard, personal } = appPath;
    if (e) e.stopPropagation();
    if (isPortalMode) {
      //未登入
      this.router.navigateByUrl(`/${personal.home}/${this.hashUserId}/${page}`);
    } else {
      this.router.navigateByUrl(`/${dashboard.home}/${page}`);
    }

    this.uiFlag.currentPage = page;
    this.uiFlag.currentTagIndex = tagIdx;
    this.uiFlag.showMorePageOpt = false;
    this.getBtnPosition(tagIdx);
    this.scrollPage(page);
  }

  /**
   * 取得頁面tag位置
   * @param tagIdx {number}-tag的顯示序
   */
  getBtnPosition(tagIdx: number) {
    const { divideIndex } = this.uiFlag;
    if (divideIndex === null || tagIdx < divideIndex) {
      setTimeout(() => {
        const tagPosition = document.querySelectorAll('.main__page__list');
        if (tagPosition && tagPosition[tagIdx]) {
          this.uiFlag.barWidth = tagPosition[tagIdx].clientWidth;
          let frontSize =
            this.pageListBar.nativeElement.getBoundingClientRect().left -
            this.navSection.nativeElement.getBoundingClientRect().left;
          for (let i = 0; i < tagIdx; i++) {
            frontSize += tagPosition[i].clientWidth;
          }

          this.uiFlag.barPosition = frontSize;
        }
      });
    } else {
      this.getSeeMorePosition();
    }
  }

  /**
   * 根據子頁面捲動頁面至指定位置
   * @param page {string}-子頁面
   */
  scrollPage(page: string) {
    const mainBodyEle = document.querySelector('.main__container') as Element;
    if (page === appPath.personal.info) {
      mainBodyEle.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const pageListBar = document.querySelectorAll('.info-pageListBar')[0] as HTMLElement;
      const pageListBarTop = pageListBar.offsetTop;
      mainBodyEle.scrollTo({ top: pageListBarTop, behavior: 'smooth' });
    }
  }

  /**
   * 取得"更多"按鈕的大小和位置，使active bar可以對齊
   */
  getSeeMorePosition() {
    setTimeout(() => {
      const pageListBar = this.pageListBar?.nativeElement;
      const seeMoreTag = this.seeMore?.nativeElement;
      if (pageListBar && seeMoreTag) {
        this.uiFlag.barWidth = seeMoreTag.clientWidth;
        this.uiFlag.barPosition = seeMoreTag.getBoundingClientRect().left;
      }
    });
  }

  /**
   * 顯示或隱藏更多列表
   * @param e {MouseEvent}
   */
  handleShowMorePageOpt(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showMorePageOpt = !this.uiFlag.showMorePageOpt;
  }

  /**
   * 若圖片不存在或載入錯誤則隱藏該元素
   */
  sceneryError() {
    console.error("Can't get personal scenery.");
    this.uiFlag.hideScenery = true;
  }

  /**
   * 轉導至指定子頁面
   * @param page {string}-指定之子頁面
   */
  handleNavigation(page: string) {
    const index = this.childPageList.indexOf(page);
    this.handleShowContent(null, page, index);
  }

  /**
   * 將批次修改隱私權狀態傳給子組件，
   * 以修正生日設定欄位日期選擇棄背覆蓋的問題
   * @param e {boolean}-是否開啟批次修改隱私權設定框
   */
  passPatchEditPrivacyStatus(e: boolean) {
    this.uiFlag.patchEditPrivacy = e;
  }

  /**
   * 轉導至建立新訊息頁面
   */
  navigateNewMailPage() {
    const userId = this.getPageOwnerId().toString();
    const hashId = this.hashIdService.handleUserIdEncode(userId);
    const { stationMail, dashboard } = appPath;
    const { messageReceiverId, messageReceiverType } = QueryString;
    const pathName = `/${dashboard.home}/${stationMail.home}/${stationMail.newMail}`;
    const query = `?${messageReceiverId}=${hashId}&${messageReceiverType}=p`;
    this.router.navigateByUrl(pathName + query);
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

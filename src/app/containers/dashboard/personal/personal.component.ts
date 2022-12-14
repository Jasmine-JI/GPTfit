import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterContentInit,
} from '@angular/core';
import { UserProfileInfo } from '../../../shared/models/user-profile-info';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { EditMode } from '../models/personal';
import { AlbumType } from '../../../shared/models/image';
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
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ShareGroupInfoDialogComponent } from '../../../shared/components/share-group-info-dialog/share-group-info-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { getUrlQueryStrings, base64ToFile } from '../../../core/utils';
import { appPath } from '../../../app-path.const';
import { QueryString } from '../../../shared/enum/query-string';

type ImgType = 'icon' | 'scenery';

@Component({
  selector: 'app-personal',
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss'],
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
    currentPage: 'activity-list',
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

  userProfile: UserProfileInfo;
  hashUserId: string;
  token = this.authService.token;
  readonly AlbumType = AlbumType;
  childPageList: Array<string> = [];

  constructor(
    private hintDialogService: HintDialogService,
    private route: ActivatedRoute,
    private router: Router,
    private hashIdService: HashIdService,
    private globalEventsService: GlobalEventsService,
    private dashboardService: DashboardService,
    private imageUploadService: ImageUploadService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private usreService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkPage();
    this.checkQueryString();
    this.handlePageResize();
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
    const { pathname, search } = location;
    const [origin, mainPath, secondPath, thirdPath] = pathname.split('/');
    switch (mainPath) {
      case 'dashboard': {
        const isSettingPath = secondPath === 'user-settings';
        const isStravaRedirectPath = `${secondPath}/${thirdPath}` === 'settings/account-info'; // strava轉導回GPTfit
        this.uiFlag.isSettingPage = isSettingPath || isStravaRedirectPath;
        this.uiFlag.isPortalMode = false;
        break;
      }
      case 'user-profile': {
        const redirectPath = `/dashboard/${thirdPath}${search}`;
        this.handleNotDashBoardPage();
        this.checkPageOwner(redirectPath);
        break;
      }
      default:
        this.handleNotDashBoardPage();
        break;
    }
  }

  /**
   * 確認目前頁面擁有者是否為自己
   */
  checkPageOwner(redirectPath: string) {
    const userId = this.usreService.getUser().userId;
    const targetUserId = this.getPageOwnerId();
    if (targetUserId === userId) this.router.navigateByUrl(redirectPath);
  }

  /**
   * 取得頁面持有人編號
   */
  getPageOwnerId() {
    this.hashUserId = this.route.snapshot.paramMap.get('userId') as string;
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
   * @author kidin-1100812
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
   * 監聽捲動事件，當捲動到tab時，tab固定置頂
   * @author kidin-1100908
   */
  handleScroll() {
    const targetElement = document.querySelectorAll('.main__container');
    const targetScrollEvent = fromEvent(targetElement, 'scroll');
    this.scrollEvent = targetScrollEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.checkPageListBarPosition();
    });
  }

  /**
   * 確認tab位置與寬度
   * @author kidin-1100908
   */
  checkPageListBarPosition() {
    if (!this.uiFlag.isSettingPage) {
      const pageListBar = document.querySelectorAll('.info-pageListBar')[0] as any;
      const headerDescriptionBlock = document.querySelectorAll('.info-headerDescriptionBlock')[0];
      const headerDescription = document.querySelectorAll('.info-headerDescription')[0];
      const scenerySection = document.querySelectorAll('.info-scenerySection')[0];
      if (pageListBar && headerDescription && scenerySection) {
        const { top: barTop } = pageListBar.getBoundingClientRect();
        const { bottom: descBottom } = headerDescription.getBoundingClientRect();
        const { width } = scenerySection.getBoundingClientRect();
        if (barTop <= 51 && descBottom < 50) {
          pageListBar.classList.add('info-pageListBar-fixed');
          headerDescriptionBlock.classList.add('info-pageListBar-replace'); // 填充原本功能列的高度
          pageListBar.style.width = `${width}px`;
        } else {
          pageListBar.classList.remove('info-pageListBar-fixed');
          headerDescriptionBlock.classList.remove('info-pageListBar-replace');
          pageListBar.style.width = `100%`;
        }

        if (this.uiFlag.isPortalMode) {
          pageListBar.style.left = 0;
          pageListBar.style.right = 0;
        }
      }
    }
  }

  /**
   * 當sidebar模式變更時，重新計算active bar位置
   * @author kidin-1091111
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
   * @author kidin-1091123
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
   * @author kidin-20200714
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
   * @author kidin-1100812
   */
  handleGlobalClick() {
    const clickEvent = fromEvent(document, 'click');
    this.clickEvent = clickEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.uiFlag.showMorePageOpt = false;
    });
  }

  /**
   * 取得頁面所需資訊
   * @author kidin-1100811
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
   * @author kidin-1100811
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
   * @author kidin-1100811
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
   * @author kidin-1100811
   */
  initChildPageList(): Array<string> {
    if (!this.uiFlag.isSettingPage) {
      let childPageList = this.childPageList;
      const { isPortalMode, isSettingPage } = this.uiFlag;
      if (!isPortalMode) {
        if (!isSettingPage) {
          childPageList = ['activity-list', 'sport-report', 'life-tracking', 'cloudrun', 'info'];
        }
      } else {
        childPageList = ['activity-list', 'sport-report', 'info'];
      }

      return childPageList;
    } else {
      return [];
    }
  }

  /**
   * 取得子頁面清單各選項按鈕寬度
   * @author kidin-1100811
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
   * @author kidin-1100811
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
   * @author kidin-1100812
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
   * @author kidin-1100812
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
        this.uiFlag.currentPage = 'activity-list';
        this.uiFlag.currentTagIndex = 0;
      } else {
        this.uiFlag.currentPage = urlArr[urlArr.length - 1].split('?')[0];
        this.uiFlag.currentTagIndex = this.childPageList.indexOf(this.uiFlag.currentPage);
      }
    }
  }

  /**
   * 確認個人介紹是否過長
   * @author kidin-1100812
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
   * @author kidin-1100812
   */
  openImgSelector(img: ImgType) {
    this.uiFlag.openImgSelector = img;
  }

  /**
   * 關閉圖片選擇器
   * @param e {any}
   * @author kidin-1100812
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
   * @author kidin-1100813
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
   * @author kidin-1091130
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
   * @param length {number}-檔案序列
   * @param userId {string}-使用者id
   * @author kidin-1091125
   */
  createFileName(length: number, userId: string) {
    const nameSpace = uuidv5('https://www.gptfit.com', uuidv5.URL),
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
   * @author kidin-1100812
   */
  openSharePersonalPage() {
    this.dialog.open(ShareGroupInfoDialogComponent, {
      hasBackdrop: true,
      data: {
        url: `${location.origin}/user-profile/${this.hashUserId}`,
        title: this.translate.instant('universal_operating_share'),
        shareName: this.userProfile.nickname || '',
        cancelText: this.translate.instant('universal_operating_confirm'),
      },
    });
  }

  /**
   * 根據使用者點選的頁面顯示內容
   * @param e {MouseEvent}
   * @param page {string}-子頁面
   * @param tagIdx {number}-tag的顯示序
   * @author kidin-1100812
   */
  handleShowContent(e: MouseEvent | null, page: string, tagIdx: number) {
    const { isPortalMode } = this.uiFlag;
    if (e) e.stopPropagation();
    if (isPortalMode) {
      this.router.navigateByUrl(`/user-profile/${this.hashUserId}/${page}`);
    } else {
      this.router.navigateByUrl(`/dashboard/${page}`);
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
   * @author kidin-1100812
   */
  getBtnPosition(tagIdx: number) {
    const { divideIndex } = this.uiFlag;
    if (divideIndex === null || tagIdx < divideIndex) {
      setTimeout(() => {
        const tagPosition = document.querySelectorAll('.main__page__list');
        if (tagPosition && tagPosition[tagIdx]) {
          this.uiFlag.barWidth = tagPosition[tagIdx].clientWidth;
          let frontSize = 0;
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
   * @author kidin-1100812
   */
  scrollPage(page: string) {
    const mainBodyEle = document.querySelector('.main__container') as Element;
    if (page === 'group-introduction') {
      mainBodyEle.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const pageListBar = document.querySelectorAll('.info-pageListBar')[0] as HTMLElement,
        pageListBarTop = pageListBar.offsetTop;
      mainBodyEle.scrollTo({ top: pageListBarTop, behavior: 'smooth' });
    }
  }

  /**
   * 取得"更多"按鈕的大小和位置，使active bar可以對齊
   * @author kidin-1100812
   */
  getSeeMorePosition() {
    setTimeout(() => {
      const pageListBar = this.pageListBar?.nativeElement;
      const seeMoreTag = this.seeMore?.nativeElement;
      if (pageListBar && seeMoreTag) {
        this.uiFlag.barWidth = seeMoreTag.clientWidth;
        this.uiFlag.barPosition =
          seeMoreTag.getBoundingClientRect().left - pageListBar.getBoundingClientRect().left;
      }
    });
  }

  /**
   * 顯示或隱藏更多列表
   * @param e {MouseEvent}
   * @author kidin-1100812
   */
  handleShowMorePageOpt(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showMorePageOpt = !this.uiFlag.showMorePageOpt;
  }

  /**
   * 若圖片不存在或載入錯誤則隱藏該元素
   * @author kidin-1091204
   */
  sceneryError() {
    console.error("Can't get personal scenery.");
    this.uiFlag.hideScenery = true;
  }

  /**
   * 轉導至指定子頁面
   * @param page {string}-指定之子頁面
   * @author kidin-1100818
   */
  handleNavigation(page: string) {
    const index = this.childPageList.indexOf(page);
    this.handleShowContent(null, page, index);
  }

  /**
   * 將批次修改隱私權狀態傳給子組件，
   * 以修正生日設定欄位日期選擇棄背覆蓋的問題
   * @param e {boolean}-是否開啟批次修改隱私權設定框
   * @author kidin-1101001
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
    const {
      stationMail: { home, newMail },
    } = appPath;
    const { messageReceiverId, messageReceiverType } = QueryString;
    this.router.navigateByUrl(
      `/dashboard/${home}/${newMail}?${messageReceiverId}=${hashId}&${messageReceiverType}=p`
    );
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}

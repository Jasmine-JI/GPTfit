import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { UserProfileService } from '../../../shared/services/user-profile.service';
import { UserProfileInfo } from '../models/userProfileInfo';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { UtilsService } from '../../../shared/services/utils.service';
import { HashIdService } from '../../../shared/services/hash-id.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { EditMode } from '../models/personal';
import { albumType } from '../../../shared/models/image';
import { DashboardService } from '../services/dashboard.service';
import { UserInfoService } from '../services/userInfo.service';
import { v5 as uuidv5 } from 'uuid';
import moment from 'moment';
import { ImageUploadService } from '../services/image-upload.service';
import { MatDialog } from '@angular/material/dialog';
import { ShareGroupInfoDialogComponent } from '../../../shared/components/share-group-info-dialog/share-group-info-dialog.component';
import { TranslateService } from '@ngx-translate/core';

type ImgType = 'icon' | 'scenery';

@Component({
  selector: 'app-personal',
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss']
})
export class PersonalComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  pageResize: Subscription;
  clickEvent: Subscription;

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
    editMode: <EditMode>'close',
    descOverflow: false,
    showMorePageOpt: false,
    isPreviewMode: false,
    openImgSelector: <ImgType>null,
    divideIndex: 99,
    currentTagIndex: 0,
    barPosition: 0,
    barWidth: 0,
    windowInnerWidth: null,
    hideScenery: false
  };

  /**
   * 管理編輯頭像或佈景
   */
  editImage = {
    edited: false,
    icon: {
      origin: null,
      base64: null
    },
    scenery: {
      origin: null,
      base64: null
    }
  }

  /**
   * 儲存子頁面清單各選項按鈕寬度
   */
  perPageOptSize = {
    total: 0,
    perSize: []
  };

  userProfile: UserProfileInfo;
  hashUserId: string;
  token = this.utils.getToken() || '';
  readonly albumType = albumType;
  childPageList = [];

  constructor(
    private userProfileService: UserProfileService,
    private utils: UtilsService,
    private route: ActivatedRoute,
    private router: Router,
    private hashIdService: HashIdService,
    private dashboardService: DashboardService,
    private userInfoService: UserInfoService,
    private imageUploadService: ImageUploadService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.checkPreviewMode(location.search);
    this.handlePageResize();
    this.checkportalMode();
    this.getNeedInfo();
    this.detectParamChange();
    if (!this.uiFlag.isPortalMode) this.handleSideBarSwitch();
    this.checkEditMode();
  }

  /**
   * 確認是否為預覽列印頁面
   * @author kidin-1100812
   */
  checkPreviewMode(queryString: string) {
    const query = this.utils.getUrlQueryStrings(queryString);
    if (query.ipm) this.uiFlag.isPreviewMode = true;
  }

  /**
   * 偵測瀏覽器是否改變大小
   * @author kidin-1100812
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    this.pageResize = page.pipe(
      switchMap(res => this.dashboardService.getRxSideBarMode().pipe(
        map(resp => res)
      )),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.checkScreenSize();
    });

  }

  /**
   * 當sidebar模式變更時，重新計算active bar位置
   * @author kidin-1091111
   */
  handleSideBarSwitch() {
    this.dashboardService.getRxSideBarMode().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {

      setTimeout(() => {
        this.checkScreenSize();
      }, 250); // 待sidebar動畫結束再計算位置
      
    })

  }

  /**
   * 當進入編輯或建立群組模式時，讓佈景或圖片進入可編輯模式
   * @author kidin-1091123
   */
  checkEditMode() {
    this.userInfoService.getRxEditMode().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.upLoadImg(res);
      this.uiFlag.openImgSelector = null;
    });

  }

  /**
   * 依瀏覽器大小將超出邊界的清單進行收納
   * @author kidin-20200714
   */
  checkScreenSize() {
    
    setTimeout(() => {
      const navSection = this.navSection.nativeElement,
            navSectionWidth = navSection.clientWidth;
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
          if (total + reservedSpace + 130 >= navSectionWidth) { // 130為"更多"按鈕的空間
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
      }, 250); // 待sidebar動畫結束再計算位置

    });

  }

  /**
   * 偵測全域點擊事件，以收納"更多"選單
   * @author kidin-1100812
   */
  handleGlobalClick() {
    const clickEvent = fromEvent(document, 'click');
    this.clickEvent = clickEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.uiFlag.showMorePageOpt = false;
    });

  }

  /**
   * 確認是否為登入後頁面
   * @author kidin-1100811
   */
  checkportalMode() {
    const { pathname } = location;
    this.uiFlag.isPortalMode = !pathname.includes('dashboard');
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
    this.hashUserId = this.route.snapshot.paramMap.get('userId');
    const userId = +this.hashIdService.handleUserIdDecode(this.hashUserId),
          body = {
            token: this.token,
            targetUserId: userId
          };
    
    this.userProfileService.getUserProfile(body).subscribe(res => {
      const { processResult, userProfile } = res as any;
      if (!processResult) {
        const { apiCode, resultMessage, resultCode } = res as any;
        this.utils.handleError(resultCode, apiCode, resultMessage);
      } else {
        const { apiCode, resultMessage, resultCode } = processResult;
        if (resultCode !== 200) {
          this.utils.handleError(resultCode, apiCode, resultMessage);
        } else {
          this.uiFlag.isPageOwner = userId === userProfile.userId;
          this.userProfile = userProfile;
          this.userInfoService.setRxTargetUserInfo(userProfile);
          this.checkDescLen();
        }

      }

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
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
console.log('userProfile', res);
      this.uiFlag.hideScenery = false;
      this.userProfile = res;
      this.userInfoService.setRxTargetUserInfo(res);
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
    let childPageList = this.childPageList;
    if (!this.uiFlag.isPortalMode) {
      childPageList = [
        'activity-list',
        'sport-report',
        'life-tracking',
        'cloudrun',
        'info',
        'user-settings',
        'personal-preferences',
        'privacy-settings',
        'account-info'
      ];
    } else {
      childPageList = [
        'activity-list',
        'sport-report',
        'info'
      ];

    }
    
    return childPageList;
  }

  /**
   * 取得子頁面清單各選項按鈕寬度
   * @author kidin-1100811
   */
  getPerPageOptSize() {
    this.uiFlag.divideIndex = null;
    if (this.clickEvent) {
      this.clickEvent.unsubscribe();
    }

    setTimeout(() => {
      this.initPageOptSize();
      const menuList = document.querySelectorAll('.main__page__list');
      this.uiFlag.barWidth = menuList[0].clientWidth;
      menuList.forEach(_menu => {
        this.perPageOptSize.perSize.push(_menu.clientWidth);
        this.perPageOptSize.total += _menu.clientWidth;
      });

      this.checkScreenSize();
    })

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
      perSize: []
    };

  }

  /**
   * 處理url param改變的事件
   * @author kidin-1100812
   */
  detectParamChange() {
    this.router.events.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.getCurrentContentPage(event);
        this.getBtnPosition(this.uiFlag.currentTagIndex);
      }

    })

  }

  /**
   * 根據url對應選單
   * @param event {NavigationStart}-變更url產生的事件
   * @author kidin-1100812
   */
  getCurrentContentPage(event = null): void {
    let urlArr: Array<string>;
    if (event !== null) {
      urlArr = event.url.split('/');
    } else {
      urlArr = location.pathname.split('/');
    }

    if (this.uiFlag.isPortalMode && urlArr.length < 4) {
      this.uiFlag.currentPage = 'activity-list';
      this.uiFlag.currentTagIndex = 0;
    } else {
      this.uiFlag.currentPage = urlArr[urlArr.length - 1].split('?')[0];
      this.uiFlag.currentTagIndex = this.childPageList.indexOf(this.uiFlag.currentPage);
    }
    
  }

  /**
   * 確認個人介紹是否過長
   * @author kidin-1100812
   */
  checkDescLen() {

    setTimeout(() => {
      const descSection = this.headerDescription.nativeElement,
            descStyle = window.getComputedStyle(descSection, null),
            descLineHeight = +descStyle.lineHeight.split('px')[0],
            descHeight = +descStyle.height.split('px')[0];
      if (descHeight / descLineHeight > 2) {
        this.uiFlag.descOverflow = true;
      } else {
        this.uiFlag.descOverflow = false;
      }

    });

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
    if (e.action === 'complete') {
      this.editImage.edited = true;
      if (e.img.albumType === albumType.personalIcon) {
        this.editImage.icon.origin = e.img.origin;
        this.editImage.icon.base64 = e.img.base64;
      } else {
        this.editImage.scenery.origin = e.img.origin;
        this.editImage.scenery.base64 = e.img.base64;
        this.uiFlag.hideScenery = false;
      }

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
      let imgArr = [];
      const formData = new FormData(),
            { userId } = this.userProfile;
      formData.set('token', this.utils.getToken());
      formData.set('targetType', '1');
      // 個人icon
      if (icon.base64 !== null) {
        const fileName = this.createFileName(imgArr.length, `${userId}`);
        imgArr.unshift({
          albumType: albumType.personalIcon,
          fileNameFull: `${fileName}.jpg`
        })

        formData.append(
          'file',
          this.utils.base64ToFile(albumType.personalIcon, icon.base64, fileName)
        );

      }

      // 個人佈景
      if (scenery.base64 !== null) {
        const fileName = this.createFileName(imgArr.length, `${userId}`);
        imgArr.unshift({
          albumType: albumType.personalScenery,
          fileNameFull: `${fileName}.jpg`
        })

        formData.append(
          'file',
          this.utils.base64ToFile(albumType.personalScenery, scenery.base64, fileName)
        );

      }

      formData.set('img', JSON.stringify(imgArr));
      this.sendImgUploadReq(formData);
    } else if (editMode === 'complete') {
      this.userProfileService.refreshUserProfile({ token: this.token });
      this.userInfoService.setRxEditMode('close');
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
    this.imageUploadService.addImg(formData).subscribe(res => {
      if (res.processResult.resultCode !== 200) {
        this.utils.openAlert('Image upload error.');
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.initImgSetting();
        this.userProfileService.refreshUserProfile({ token: this.token });
        this.userInfoService.setRxEditMode('close');
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
          keyword = `${moment().valueOf().toString()}${length}${userId.split('-').join('')}`;
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
        base64: null
      },
      scenery: {
        origin: null,
        base64: null
      }
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
        cancelText: this.translate.instant('universal_operating_confirm')
      }

    });

  }

  /**
   * 根據使用者點選的頁面顯示內容
   * @param e {MouseEvent}
   * @param page {string}-子頁面
   * @param tagIdx {number}-tag的顯示序
   * @author kidin-1100812
   */
  handleShowContent(e: MouseEvent, page: string, tagIdx: number) {
    if (e) e.stopPropagation();
    if (this.uiFlag.isPortalMode) {
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
    const scrollEleClass = this.uiFlag.isPortalMode ? '.main' : '.main-body',
          mainBodyEle = document.querySelector(scrollEleClass);
    if (page === 'group-introduction') {
      mainBodyEle.scrollTo({top: 0, behavior: 'smooth'});
    } else {
      const pageListBar = document.querySelectorAll('.info-pageListBar')[0] as HTMLElement,
            pageListBarTop = pageListBar.offsetTop;
      mainBodyEle.scrollTo({top: pageListBarTop, behavior: 'smooth'});
    }
    
  }

  /**
   * 取得"更多"按鈕的大小和位置，使active bar可以對齊
   * @author kidin-1100812
   */
  getSeeMorePosition() {

    setTimeout(() => {
      const pageListBar = this.pageListBar.nativeElement,
            seeMoreTag = this.seeMore.nativeElement;
      this.uiFlag.barWidth = seeMoreTag.clientWidth;
      this.uiFlag.barPosition = seeMoreTag.getBoundingClientRect().left - pageListBar.getBoundingClientRect().left;
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
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

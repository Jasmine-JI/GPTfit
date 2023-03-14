import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  AfterViewChecked,
  ViewChild,
} from '@angular/core';
import { fromEvent, Subscription, Subject, forkJoin, merge } from 'rxjs';
import { debounceTime, takeUntil, switchMap, map } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ShareGroupInfoDialogComponent } from '../../../../shared/components/share-group-info-dialog/share-group-info-dialog.component';
import { GroupDetailInfo, UserSimpleInfo, EditMode } from '../../models/group-detail';
import dayjs from 'dayjs';
import {
  HashIdService,
  UserService,
  GlobalEventsService,
  AuthService,
  Api11xxService,
  HintDialogService,
} from '../../../../core/services';
import { v5 as uuidv5 } from 'uuid';
import { ImageUploadService } from '../../services/image-upload.service';
import { AlbumType } from '../../../../shared/models/image';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { PrivacySettingDialogComponent } from '../../../../shared/components/privacy-setting-dialog/privacy-setting-dialog.component';
import { DataUnitType } from '../../../../core/enums/common';
import { DateUnit } from '../../../../shared/enum/report';
import { GroupLevel } from '../../models/group-detail';
import { deepCopy, base64ToFile, displayGroupLevel } from '../../../../core/utils';
import { ProfessionalService } from '../../../professional/services/professional.service';
import { AccessRight } from '../../../../shared/enum/accessright';
import { appPath } from '../../../../app-path.const';
import { QueryString } from '../../../../shared/enum/query-string';
import { GroupChildPage } from '../../../../shared/enum/professional';

const errMsg = `Error.<br />Please try again later.`;
const replaceResult = {
  resultCode: 200,
  resultMessage: '',
  msgCode: 5008,
  apiCode: 1103,
  info: {
    groupMemberInfo: [],
    rtnMsg: '',
    subGroupInfo: {},
    totalCounts: 0,
  },
};

@Component({
  selector: 'app-group-info-v2',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss'],
})
export class GroupInfoComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('navSection') navSection: ElementRef;
  @ViewChild('pageListBar') pageListBar: ElementRef;
  @ViewChild('seeMore') seeMore: ElementRef;
  @ViewChild('groupHeaderDescription') groupHeaderDescription: ElementRef;

  private ngUnsubscribe = new Subject();
  groupIdSubscription: Subscription;
  clickEvent: Subscription;
  scrollEvent: Subscription;

  i18n = {
    allMember: '',
    nickname: '',
    file: '',
    sportReport: '',
    openObj: '',
    notOpenObj: '',
    brandAdmin: '',
    branchAdmin: '',
    coach: '',
    teacher: '',
    comAdmin: '',
    subComAdmin: '',
    departmentAdmin: '',
    myGym: '',
  };

  /**
   * 使用者在此群組的身份資料
   */
  user = <UserSimpleInfo>{
    nickname: '',
    userId: null,
    unit: DataUnitType.metric,
    token: this.authService.token,
    accessRight: this.userService.getUser().systemAccessright,
    joinStatus: 2,
    isGroupAdmin: false,
    privacy: {
      activityTracking: [1],
      activityTrackingReport: [1],
      lifeTrackingReport: [1],
    },
  };

  /**
   * 操控頁面UI的各個flag
   */
  uiFlag = {
    windowInnerWidth: null,
    showMorePageOpt: false,
    divideIndex: 99,
    currentPage: GroupChildPage.groupIntroduction,
    currentTagIndex: 0,
    barPosition: 0,
    barWidth: 0,
    createLevel: null,
    isPreviewMode: false,
    editMode: <EditMode>'close',
    openSceneryImgSelector: false,
    openIconImgSelector: false,
    groupDescOverflow: false,
    hideScenery: false,
    portalMode: false,
    isLoading: false,
    isJoinLoading: false,
  };

  /**
   * 此群組相關資料
   */
  currentGroupInfo = {
    brandType: 1,
    groupId: '',
    hashGroupId: '',
    groupLevel: 99,
    groupDetail: <GroupDetailInfo>{},
    allGroupInfo: {},
    commerceInfo: <any>{},
  };

  /**
   * 群組子頁面清單
   */
  childPageList: Array<GroupChildPage> = [];

  /**
   * 儲存子頁面清單各選項按鈕寬度
   */
  perPageOptSize = {
    total: 0,
    perSize: [],
  };

  /**
   * 變更照片
   */
  editImage = {
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

  newGroupId: string;

  readonly AccessRight = AccessRight;
  readonly GroupChildPage = GroupChildPage;

  constructor(
    private translate: TranslateService,
    private api11xxService: Api11xxService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute,
    private router: Router,
    private hintDialogService: HintDialogService,
    private userService: UserService,
    private dialog: MatDialog,
    private imageUploadService: ImageUploadService,
    private globalEventsService: GlobalEventsService,
    private authService: AuthService,
    private professionalService: ProfessionalService
  ) {}

  /**
   * 1. 確認視窗大小
   * 2. 訂閱視窗大小
   * @author kidin-20200710
   */
  ngOnInit(): void {
    this.checkPage();
    this.checkQueryString(location.search);
    this.detectParamChange();
    this.detectGroupIdChange();
    this.handlePageResize();
    this.handleLanguageChange();
    if (!this.uiFlag.isPreviewMode) this.handleScroll();
    this.handleSideBarSwitch();
    this.checkEditMode();
  }

  ngAfterViewChecked() {}

  /**
   * 偵測瀏覽器是否改變大小
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    page.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
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
   * @author kidin-1100908
   */
  handleScroll() {
    const targetElement = document.querySelector('.main__container');
    const targetScrollEvent = fromEvent(targetElement, 'scroll');
    this.scrollEvent = targetScrollEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.checkPageListBarPosition();
    });
  }

  /**
   * 確認tab位置與寬度
   */
  checkPageListBarPosition() {
    const pageListBar = document.querySelectorAll('.info-pageListBar')[0] as any,
      headerDescriptionBlock = document.querySelectorAll('.info-headerDescriptionBlock')[0],
      headerDescription = document.querySelectorAll('.info-headerDescription')[0],
      scenerySection = document.querySelectorAll('.info-scenerySection')[0];
    if (pageListBar && headerDescription && scenerySection) {
      const { top: barTop } = pageListBar.getBoundingClientRect(),
        { bottom: descBottom } = headerDescription.getBoundingClientRect(),
        { width } = scenerySection.getBoundingClientRect();
      if (barTop <= 51 && descBottom < 50) {
        pageListBar.classList.add('info-pageListBar-fixed');
        headerDescriptionBlock.classList.add('info-pageListBar-replace'); // 填充原本功能列的高度
        pageListBar.style.width = `${width}px`;
      } else {
        pageListBar.classList.remove('info-pageListBar-fixed');
        headerDescriptionBlock.classList.remove('info-pageListBar-replace');
        pageListBar.style.width = `100%`;
      }

      if (this.uiFlag.portalMode) {
        const cardSection = document.querySelectorAll('.cardSection')[0],
          { left } = cardSection.getBoundingClientRect();
        pageListBar.style.left = `${left}px`;
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
      .subscribe(() => {
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
    this.professionalService
      .getRxEditMode()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.upLoadImg(res);
        this.uiFlag.openIconImgSelector = false;
        this.uiFlag.openSceneryImgSelector = false;
      });
  }

  /**
   * 如有編輯圖片則進行上傳
   * @param editMode {EditMode}-編輯模式的狀態
   * @author kidin-1091125
   */
  upLoadImg(editMode: EditMode) {
    if (editMode === 'complete' && this.editImage.edited) {
      const imgArr = [];
      const formData = new FormData();
      formData.set('token', this.authService.token);
      formData.set('targetType', '2');

      if (this.uiFlag.editMode === 'edit') {
        formData.set('targetGroupId', this.currentGroupInfo.groupDetail.groupId);

        // 群組icon
        if (this.editImage.icon.base64 !== null) {
          const fileName = this.createFileName(
            imgArr.length,
            this.currentGroupInfo.groupDetail.groupId
          );
          imgArr.unshift({
            albumType: AlbumType.groupIcon,
            fileNameFull: `${fileName}.jpg`,
          });

          formData.append('file', base64ToFile(this.editImage.icon.base64, fileName));
        }

        // 群組佈景
        if (this.editImage.scenery.base64 !== null) {
          const fileName = this.createFileName(
            imgArr.length,
            this.currentGroupInfo.groupDetail.groupId
          );
          imgArr.unshift({
            albumType: AlbumType.groupScenery,
            fileNameFull: `${fileName}.jpg`,
          });

          formData.append('file', base64ToFile(this.editImage.scenery.base64, fileName));
        }

        formData.set('img', JSON.stringify(imgArr));
        this.sendImgUploadReq(formData, this.currentGroupInfo.groupDetail.groupId);
      } else if (this.uiFlag.editMode === 'create') {
        this.groupIdSubscription = this.professionalService
          .getNewGroupId()
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((res) => {
            this.newGroupId = res;
            // 群組icon
            if (this.editImage.icon.base64 !== null) {
              const fileName = this.createFileName(imgArr.length, this.newGroupId);
              imgArr.unshift({
                albumType: AlbumType.groupIcon,
                fileNameFull: `${fileName}.jpg`,
              });

              formData.append('file', base64ToFile(this.editImage.icon.base64, fileName));
            }

            // 群組佈景
            if (this.editImage.scenery.base64 !== null) {
              const fileName = this.createFileName(imgArr.length, this.newGroupId);
              imgArr.unshift({
                albumType: AlbumType.groupScenery,
                fileNameFull: `${fileName}.jpg`,
              });

              formData.append('file', base64ToFile(this.editImage.scenery.base64, fileName));
            }

            formData.set('img', JSON.stringify(imgArr));
            formData.set('targetGroupId', this.newGroupId);
            this.sendImgUploadReq(formData, this.newGroupId);
          });
      }
    } else if (this.uiFlag.editMode === 'create' && editMode === 'complete') {
      this.closeCreateMode();
      this.groupIdSubscription = this.professionalService
        .getNewGroupId()
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((res) => {
          this.handleNavigation(res);
        });
    } else if (editMode === 'complete') {
      this.getGroupNeedInfo();
      this.professionalService.setEditMode('close');
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
  sendImgUploadReq(formData: FormData, groupId: string) {
    this.imageUploadService.addImg(formData).subscribe((res) => {
      if (res.processResult.resultCode !== 200) {
        this.hintDialogService.openAlert(
          'Image upload error.<br>Please change image and try again.'
        );
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.initImgSetting();
        if (this.uiFlag.editMode === 'create') {
          this.closeCreateMode();
          this.handleNavigation(groupId);
        } else {
          this.getGroupNeedInfo();
          this.professionalService.setEditMode('close');
        }
      }
    });

    if (this.groupIdSubscription) {
      this.groupIdSubscription.unsubscribe();
    }
  }

  /**
   * 建立圖片名稱
   * @param length {number}-檔案序列
   * @param groupId {string}-群組id
   * @author kidin-1091125
   */
  createFileName(length: number, groupId: string) {
    const nameSpace = uuidv5('https://www.gptfit.com', uuidv5.URL),
      keyword = `${dayjs().valueOf().toString()}${length}${groupId.split('-').join('')}`;
    return uuidv5(keyword, nameSpace);
  }

  /**
   * 將圖片設定初始化
   * @author kidin-1091201
   */
  initImgSetting() {
    this.uiFlag.hideScenery = false;
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
   * 偵測全域點擊事件，以收納"更多"選單
   * @author kidin-20201112
   */
  handleGlobalClick() {
    const clickEvent = fromEvent(document, 'click');
    this.clickEvent = clickEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.uiFlag.showMorePageOpt = false;
    });
  }

  /**
   * 確認url的query string
   * @param query {string}-url query string
   * @author kidin-1091106
   */
  checkQueryString(query: string) {
    if (query.indexOf('?') > -1) {
      const queryArr = query.split('?')[1].split('&');
      queryArr.forEach((_query) => {
        switch (_query.split('=')[0]) {
          case 'createType':
            this.openCreateMode(_query.split('=')[1]);
            break;
          case 'brandType':
            this.currentGroupInfo.brandType = +_query.split('=')[1];
            break;
          case 'ipm':
            this.uiFlag.isPreviewMode = true;
            break;
        }
      });
    }
  }

  /**
   * 處理url param改變的事件
   * @author kidin-1091110
   */
  detectParamChange() {
    this.router.events.pipe(takeUntil(this.ngUnsubscribe)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkQueryString(event.url);
        this.getCurrentContentPage(event);
        this.getBtnPosition(this.uiFlag.currentTagIndex);
      }
    });
  }

  /**
   * 處理切換不同群組的事件
   * @author kidin-1091110
   */
  detectGroupIdChange() {
    this.route.params.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      this.detectGroupChange();
    });
  }

  /**
   * 根據權限和群組類別決定是否開啟建立群組模式
   * @param type {string}-欲新建的群組type
   * @author kidin-1091106
   */
  openCreateMode(type: string) {
    const { accessRight } = this.user;
    if (accessRight) {
      switch (type) {
        case 'brand':
          if (accessRight <= AccessRight.marketing) {
            this.uiFlag.createLevel = 30;
          }

          break;
        case 'branch':
          if (accessRight <= AccessRight.brandAdmin) {
            this.uiFlag.createLevel = 40;
          }

          break;
        case 'coach':
        case 'department':
          if (accessRight <= AccessRight.branchAdmin) {
            this.uiFlag.createLevel = 60;
          }

          break;
        default:
          this.closeCreateMode();
          break;
      }
    } else {
      // 待api取得user資訊再判斷是否進入create mode(網站重新整理時)
      setTimeout(() => {
        this.openCreateMode(type);
      }, 250);
    }
  }

  /**
   * 關閉建立群組模式
   * @author kidin-1091106
   */
  closeCreateMode() {
    // 移除query string，避免create mode被重複開啟
    const newUrl = `${location.origin}${location.pathname}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
    this.professionalService.setEditMode('close');
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
        const navSection = this.navSection.nativeElement;
        const navSectionWidth = navSection.clientWidth;
        let reservedSpace = 0;
        this.uiFlag.windowInnerWidth = window.innerWidth;
        const { innerWidth } = window;
        if (innerWidth >= 1000 && innerWidth <= 1390) {
          reservedSpace = 270; // sidebar展開所需的空間
        }

        if (navSectionWidth < this.perPageOptSize.total + reservedSpace) {
          const titleSizeList = this.perPageOptSize.perSize;
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

        this.getBtnPosition(this.uiFlag.currentTagIndex);
        this.checkPageListBarPosition();
      });
  }

  /**
   * 取得token
   * @author kidin-1090716
   */
  checkPage() {
    const { token } = this.user;
    const { pathname, search } = location;
    const notDashboardPage = pathname.indexOf('dashboard') < 0;
    if (notDashboardPage && token !== '') {
      this.router.navigateByUrl(`/dashboard${pathname}${search}`);
    } else if (notDashboardPage) {
      this.uiFlag.portalMode = true;
    } else {
      this.uiFlag.portalMode = false;
    }
  }

  /**
   * 切換不同群組頁面即更新群組和使用者相關資訊
   */
  detectGroupChange() {
    if (this.currentGroupInfo.hashGroupId !== this.route.snapshot.paramMap.get('groupId')) {
      this.professionalService.setEditMode('close');
      this.getCurrentGroupInfo();
      this.getGroupNeedInfo();
    } else {
      this.getRxGroupNeedInfo();
    }
  }

  /**
   * 從url取得當前頁面的群組ID和階層
   * @author kidin-1090716
   */
  getCurrentGroupInfo() {
    const groupId = this.route.snapshot.paramMap.get('groupId');
    this.currentGroupInfo.hashGroupId = groupId;
    this.currentGroupInfo.groupId = this.hashIdService.handleGroupIdDecode(groupId);
    this.currentGroupInfo.groupLevel = displayGroupLevel(this.currentGroupInfo.groupId);
    this.professionalService.checkGroupAccessright(this.currentGroupInfo.groupId);
  }

  /**
   * 取得當前群組詳細資訊
   * @author kidin-1090716
   */
  getGroupNeedInfo() {
    /**
     * api 1102 request body
     */
    const detailBody = {
      token: this.user.token,
      groupId: this.currentGroupInfo.groupId,
      findRoot: 1,
      avatarType: 3,
    };

    const groupIdArr = this.currentGroupInfo.groupId.split('-');
    groupIdArr.length = 3;

    /**
     * api 1115 request body
     */
    const commerceBody = {
      token: this.user.token,
      groupId: `${groupIdArr.join('-')}-0-0-0`,
    };

    /**
     * api 1103 request body
     */
    const childGroupBody = {
      token: this.user.token,
      avatarType: 3,
      groupId: this.currentGroupInfo.groupId,
      groupLevel: this.currentGroupInfo.groupLevel,
      infoType: 1,
    };

    /**
     * api 1103 request body
     */
    const adminListBody = {
      token: this.user.token,
      avatarType: 3,
      groupId: this.currentGroupInfo.groupId,
      groupLevel: this.currentGroupInfo.groupLevel,
      infoType: 2,
    };

    /**
     * api 1103 request body
     */
    const memberListBody = {
      token: this.user.token,
      avatarType: 3,
      groupId: this.currentGroupInfo.groupId,
      groupLevel: this.currentGroupInfo.groupLevel,
      infoType: 3,
    };

    this.uiFlag.isLoading = true;
    if (this.uiFlag.portalMode) {
      forkJoin([
        this.api11xxService.fetchGroupListDetail(detailBody),
        this.api11xxService.fetchCommerceInfo(commerceBody),
      ]).subscribe((resArr) => {
        this.uiFlag.isLoading = false;
        this.uiFlag.hideScenery = false;
        this.handleDetail(resArr[0]);
        this.handleCommerce(resArr[1]);
        this.checkUserAccessRight();
        this.childPageList = this.initChildPageList();
        this.getCurrentContentPage();
        this.getPerPageOptSize();
      });
    } else {
      forkJoin([
        this.api11xxService.fetchGroupListDetail(detailBody),
        this.api11xxService.fetchCommerceInfo(commerceBody),
        this.api11xxService.fetchGroupMemberList(childGroupBody),
        this.api11xxService.fetchGroupMemberList(adminListBody),
        this.api11xxService.fetchGroupMemberList(memberListBody),
      ])
        .pipe(
          map((resArr) => {
            // 處理創建群組模式時api 1103 exception的問題
            if (resArr[4].resultCode !== 200) resArr[4] = deepCopy(replaceResult);
            return resArr;
          })
        )
        .subscribe((resArr) => {
          const [detail, commerceInfo, GroupList, adminList, memberList] = resArr;
          this.uiFlag.isLoading = false;
          this.uiFlag.hideScenery = false;
          this.handleDetail(detail);
          this.handleCommerce(commerceInfo);
          this.handleMemberList(GroupList, adminList, memberList);
          this.checkUserAccessRight();
          this.childPageList = this.initChildPageList();
          this.getCurrentContentPage();
          this.getPerPageOptSize();
        });
    }
  }

  /**
   * 取得管理員和成員名單
   * @param groupArchitecture {GroupArchitecture}-api 1103的群組階層（subGroupInfo）
   * @author kidin-1091111
   */
  refreshMemberList() {
    const body = {
      token: this.user.token,
      avatarType: 3,
      groupId: this.currentGroupInfo.groupId,
      groupLevel: this.currentGroupInfo.groupLevel,
      infoType: 3,
    };

    this.api11xxService.fetchGroupMemberList(body).subscribe((res) => {
      if (res.resultCode !== 200) {
        this.hintDialogService.openAlert(errMsg);
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.professionalService.setNormalMemberList(res.info.groupMemberInfo);
      }
    });
  }

  /**
   * 處理api 1102的response
   * @param res {any}-api 1102 response
   * @author kidin-1091104
   */
  handleDetail(res: any) {
    if (res.resultCode !== 200) {
      if (this.currentGroupInfo.groupId !== '0-0-0-0-0-0') {
        this.hintDialogService.openAlert(errMsg);
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.saveDefaultGroupDetail();
      }
    } else {
      if (res.info.groupId === '0-0-0-0-0-0') {
        this.saveDefaultGroupDetail();
      } else {
        const { info } = res;
        this.user.joinStatus = info.selfJoinStatus;
        this.currentGroupInfo.groupDetail = info;
        this.professionalService.getCurrentGroupInfo().groupDetail = info;
        this.professionalService.saveGroupDetail(this.handleSportTarget(info));
        this.checkGroupResLength();
      }
    }
  }

  /**
   * 儲存預設為0-0-0-0-0-0的群組資訊
   * @author kidin-1100105
   */
  saveDefaultGroupDetail() {
    const rootGroupDetail = {
      brandType: this.currentGroupInfo.brandType,
      classActivityType: [],
      coachType: '',
      commerceStatus: 1,
      expired: false,
      groupDesc: '',
      groupIcon: '',
      groupThemeImgUrl: '',
      groupId: '0-0-0-0-0-0',
      groupName: '',
      groupRootInfo: [null, null],
      groupStatus: 2,
      groupVideoUrl: '',
      rtnMsg: '',
      selfJoinStatus: 5,
      shareActivityToMember: {
        disableAccessRight: Array(0),
        enableAccessRight: Array(0),
        switch: '2',
      },
      shareAvatarToMember: {
        disableAccessRight: Array(0),
        enableAccessRight: Array(0),
        switch: '1',
      },
      shareReportToMember: {
        disableAccessRight: Array(0),
        enableAccessRight: Array(0),
        switch: '2',
      },
      target: {
        name: `${GroupLevel.brand}`,
        cycle: DateUnit.week,
        condition: [],
      },
    };

    this.professionalService.saveGroupDetail(rootGroupDetail);
    this.currentGroupInfo.groupDetail = rootGroupDetail;
  }

  /**
   * 處理api 1102的response
   * @param res {any}-api 1115 response
   * @author kidin-1091104
   */
  handleCommerce(res: any) {
    if (res.resultCode !== 200) {
      this.hintDialogService.openAlert(errMsg);
      console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
    } else {
      const { info } = res;
      if (dayjs(info.commercePlanExpired).valueOf() < dayjs().valueOf()) {
        Object.assign(info, { expired: true });
      } else {
        Object.assign(info, { expired: false });
      }

      this.currentGroupInfo.commerceInfo = info;
      this.professionalService.getCurrentGroupInfo().commerceInfo = info;
      this.professionalService.saveCommerceInfo(info);
    }
  }

  /**
   * 處理api 1103
   * @param adminRes {any}-管理員清單
   * @param memberRes {any}-一般成員清單
   * @author kidin-1091209
   */
  handleMemberList(childGroupRes: any, adminRes: any, memberRes: any) {
    if (
      childGroupRes.resultCode !== 200 ||
      adminRes.resultCode !== 200 ||
      memberRes.resultCode !== 200
    ) {
      console.error(
        `${childGroupRes.resultCode}: Api ${childGroupRes.apiCode} ${childGroupRes.resultMessage}`
      );
      console.error(`${adminRes.resultCode}: Api ${adminRes.apiCode} ${adminRes.resultMessage}`);
      console.error(`${memberRes.resultCode}: Api ${memberRes.apiCode} ${memberRes.resultMessage}`);
    } else {
      const groupLevel = displayGroupLevel(this.currentGroupInfo.groupId);
      if (groupLevel <= 30) {
        Object.assign(this.currentGroupInfo.groupDetail, {
          branchNum: childGroupRes.info.subGroupInfo.branches.length,
        });
      }

      if (groupLevel <= 40) {
        Object.assign(this.currentGroupInfo.groupDetail, {
          coachNum: childGroupRes.info.subGroupInfo.coaches.length,
        });
      }

      Object.assign(childGroupRes.info.subGroupInfo, { groupId: this.currentGroupInfo.groupId });
      this.professionalService.setAllLevelGroupData(childGroupRes.info.subGroupInfo);
      this.professionalService.setAdminList(adminRes.info.groupMemberInfo);
      this.professionalService.setNormalMemberList(memberRes.info.groupMemberInfo);

      this.professionalService.getCurrentGroupInfo().immediateGroupList =
        childGroupRes.info.subGroupInfo;
      this.professionalService.getCurrentGroupInfo().adminList = adminRes.info.groupMemberInfo;
      this.professionalService.getCurrentGroupInfo().memberList = memberRes.info.groupMemberInfo;

      adminRes.info.groupMemberInfo = adminRes.info.groupMemberInfo.filter(
        (_admin) => _admin.groupId === this.currentGroupInfo.groupId
      );
      Object.assign(this.currentGroupInfo.groupDetail, {
        adminNum: adminRes.info.groupMemberInfo.length,
      });
      Object.assign(this.currentGroupInfo.groupDetail, {
        memberNum: memberRes.info.groupMemberInfo.length,
      });
      this.professionalService.saveGroupDetail(this.currentGroupInfo.groupDetail);
    }
  }

  /**
   * 取得群組運動目標（自訂或繼承其他階層目標）
   * @param info {any}-群組詳細資訊
   * @author kidin-1110307
   */
  handleSportTarget(info: any) {
    const { target } = info;
    const groupLevel = displayGroupLevel(info.groupId);
    let sportTarget: any;
    if (target && target.name) {
      const targetReferenceLevel = +target.name;
      sportTarget =
        targetReferenceLevel == groupLevel
          ? target
          : this.getReferenceTarget(info, targetReferenceLevel);
    } else {
      // 若舊有子群組從未設置目標，則預設繼承品牌目標
      sportTarget =
        groupLevel == GroupLevel.brand ? target : this.getReferenceTarget(info, GroupLevel.brand);
    }

    Object.assign(info, { target: sportTarget });
    return info;
  }

  /**
   * 取得繼承對象之目標
   * @param info {any}-群組詳細資訊
   * @param level {GroupLevel}-對象階層
   * @author kidin-1110309
   */
  getReferenceTarget(info: any, level: GroupLevel) {
    const { groupRootInfo } = info;
    const referenceIndex = level === GroupLevel.brand ? 2 : 3;
    return deepCopy(groupRootInfo[referenceIndex].target);
  }

  /**
   * 藉由rx取得已儲存的資訊
   * @author kidin-1091105
   */
  getRxGroupNeedInfo() {
    forkJoin([
      this.professionalService.getRxGroupDetail(),
      this.professionalService.getRxCommerceInfo(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((resArr) => {
        this.user.joinStatus = (resArr[0] as any).info.selfJoinStatus;
        this.currentGroupInfo.groupDetail = (resArr[0] as any).info;
        this.currentGroupInfo.commerceInfo = (resArr[1] as any).info;
        this.checkUserAccessRight();
        this.childPageList = this.initChildPageList();
        this.getCurrentContentPage();
        this.getPerPageOptSize();
        this.checkGroupResLength();
      });
  }

  /**
   * 確認群組介紹是否過長
   * @author kidin-1091204
   */
  checkGroupResLength() {
    setTimeout(() => {
      const descSection = this.groupHeaderDescription.nativeElement,
        descStyle = window.getComputedStyle(descSection, null),
        descLineHeight = +descStyle.lineHeight.split('px')[0],
        descHeight = +descStyle.height.split('px')[0];

      if (descHeight / descLineHeight > 2) {
        this.uiFlag.groupDescOverflow = true;
      } else {
        this.uiFlag.groupDescOverflow = false;
      }
    });
  }

  /**
   * 根據url對應選單
   * @param event {NavigationStart}-變更url產生的事件
   * @author kidin-1090813
   */
  getCurrentContentPage(event = null): void {
    let urlArr: Array<string>;
    if (event !== null) {
      urlArr = event.url.split('/');
    } else {
      urlArr = location.pathname.split('/');
    }

    if (urlArr.indexOf('group-info') > -1) {
      if (this.uiFlag.portalMode) {
        this.uiFlag.currentPage = GroupChildPage.groupIntroduction;
        this.uiFlag.currentTagIndex = 0;
        this.handleNavigation(this.currentGroupInfo.groupId);
      } else if (urlArr.length === 5) {
        const pageString = urlArr[urlArr.length - 1].split('?')[0];
        this.uiFlag.currentPage = this.getGroupPageCode(pageString);
        this.uiFlag.currentTagIndex = this.childPageList.indexOf(this.uiFlag.currentPage);
      } else {
        this.handleNavigation(this.currentGroupInfo.groupId);
      }
    }
  }

  /**
   * 取得使用者該群組權限
   * @author kidin-1090811
   */
  checkUserAccessRight() {
    if (this.user.token.length !== 0) {
      this.userService
        .getUser()
        .rxUserProfile.pipe(
          switchMap((res) =>
            this.professionalService.groupAccessright.pipe(
              map((resp) => {
                const { nickname, userId, privacy, unit } = res as any;
                const userObj = {
                  accessRight: resp,
                  nickname,
                  userId,
                  privacy,
                  unit,
                };

                return userObj;
              })
            )
          ),
          takeUntil(this.ngUnsubscribe)
        )
        .subscribe((result) => {
          const { systemAccessright } = this.userService.getUser();
          const { accessRight, nickname, userId, privacy, unit } = result as any;
          this.user = {
            ...this.user,
            accessRight:
              systemAccessright <= AccessRight.marketing ? systemAccessright : accessRight,
            nickname: nickname,
            userId: userId,
            privacy: privacy,
            unit: unit,
            isGroupAdmin: this.professionalService.isAdmin,
          };

          this.professionalService.saveUserSimpleInfo(this.user);
        });
    }
  }

  /**
   * 根據群組類別、群組階層、群組經營狀態、使用者權限等，顯示可點選的頁面
   */
  initChildPageList(): Array<GroupChildPage> {
    const { accessRight } = this.user;
    const groupDetail = this.currentGroupInfo.groupDetail;
    const commerceInfo = this.currentGroupInfo.commerceInfo;
    const isEnterpriseType = groupDetail.brandType === 2;
    const inClassLevel = this.currentGroupInfo.groupLevel === 60;
    const inBrandLevel = this.currentGroupInfo.groupLevel === 30;
    const inOperation = !commerceInfo.expired && +commerceInfo.commerceStatus === 1;
    const notLock = this.currentGroupInfo.groupDetail.groupStatus !== 6;
    const upperClassAdmin = accessRight <= AccessRight.coachAdmin;
    const isGroupMember = accessRight <= AccessRight.member;
    const upperMarktingManage = accessRight <= AccessRight.marketing;
    const isValidGroup = inOperation && notLock;
    const childPageSet = new Set<GroupChildPage>(); // 用 set 避免頁面設定重複
    childPageSet.add(GroupChildPage.groupIntroduction);

    // 登入環境
    if (!this.uiFlag.portalMode) {
      childPageSet.add(GroupChildPage.groupArchitecture);
      childPageSet.add(GroupChildPage.adminList);

      // 系統管理員或品牌階層管理員可以看到方案管理頁面
      const haveBrandAccessRight = inBrandLevel && (upperMarktingManage || this.user.isGroupAdmin);
      if (haveBrandAccessRight) childPageSet.add(GroupChildPage.commercePlan);

      // 成員列表與裝置列表僅群組管理員可以瀏覽
      if (upperClassAdmin) {
        childPageSet.add(GroupChildPage.memberList);
        childPageSet.add(GroupChildPage.deviceList);

        if (isValidGroup) {
          childPageSet.add(GroupChildPage.classAnalysis);
          childPageSet.add(GroupChildPage.operationReport);
        }
      }

      // 營運中群組，群組成員可以看到課程分析報告以外的各式報告
      if (isGroupMember && isValidGroup) {
        childPageSet.add(GroupChildPage.sportsReport);
        childPageSet.add(GroupChildPage.cloudrunReport);

        if (isEnterpriseType) childPageSet.add(GroupChildPage.lifeTracking);
        if (inClassLevel && !isEnterpriseType) childPageSet.add(GroupChildPage.myclassReport);
      }
    }

    return Array.from(childPageSet).sort((_a, _b) => _a - _b);
  }

  /**
   * 取得子頁面清單各選項按鈕寬度
   */
  getPerPageOptSize() {
    this.uiFlag.divideIndex = null;
    if (this.clickEvent) {
      this.clickEvent.unsubscribe();
    }

    setTimeout(() => {
      this.initPageOptSize();
      const menuList = document.querySelectorAll('.main__page__list');
      this.uiFlag.barWidth = menuList[0]?.clientWidth ?? 65;
      menuList.forEach((_menu) => {
        this.perPageOptSize.perSize.push(_menu.clientWidth);
        this.perPageOptSize.total += _menu.clientWidth;
      });

      this.checkScreenSize();
    });
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
   * 加入群組並顯示隱私權
   */
  joinGroup() {
    if (this.user.token.length === 0) {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
          this.currentGroupInfo.groupId
        )}/group-introduction`
      );
    } else {
      this.translate.get('hellow world').subscribe(() => {
        const bodyText = this.translate.instant('universal_group_joinClassStatement', {
          object: this.translate.instant('universal_privacy_myGym'),
        });

        return this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: this.translate.instant('universal_group_disclaimer'),
            body: bodyText,
            confirmText: this.translate.instant('universal_operating_agree'),
            cancelText: this.translate.instant('universal_operating_disagree'),
            onConfirm: () => {
              this.checkoutUserPrivacy();
            },
          },
        });
      });
    }
  }

  /**
   * 確認使用者的隱私權設定
   */
  checkoutUserPrivacy() {
    let openPrivacy = true;
    for (const privacyType in this.user.privacy) {
      if (Object.prototype.hasOwnProperty.call(this.user.privacy, privacyType)) {
        const privacyArr = this.user.privacy[privacyType];
        if (
          !privacyArr.some((_privacy) => +_privacy === 4) &&
          !privacyArr.some((_privacy) => +_privacy === 99)
        ) {
          openPrivacy = false;
        }
      }
    }

    if (openPrivacy) {
      this.handleJoinGroup(1);
    } else {
      this.openPrivacySetting();
    }
  }

  /**
   * 顯示隱私權設定框
   */
  openPrivacySetting() {
    // 待上一個dialog完全關閉再開啟隱私權設定dialog
    setTimeout(() => {
      this.dialog.open(PrivacySettingDialogComponent, {
        hasBackdrop: true,
        data: {
          groupName: this.currentGroupInfo.groupDetail.groupName,
          privacy: this.user.privacy,
          onConfirm: () => {
            this.handleJoinGroup(1);
          },
        },
      });
    });
  }

  /**
   * 使用者加入或退出群組
   * @event click
   */
  handleJoinGroup(actionType: number) {
    const { token, joinStatus } = this.user;
    const {
      groupId,
      groupDetail: { brandType, groupStatus },
    } = this.currentGroupInfo;
    const body = { token, groupId, brandType, actionType };
    this.uiFlag.isJoinLoading = true;
    this.api11xxService.fetchActionGroup(body).subscribe((res) => {
      if (res.resultCode !== 200) {
        this.hintDialogService.openAlert(errMsg);
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        if (groupStatus === 1 || joinStatus === 2) {
          this.professionalService.refreshAllGroupAccessright();
          this.getGroupNeedInfo();
        } else if (actionType === 1 && groupStatus === 2) {
          this.user.joinStatus = 1;
          this.refreshMemberList();
        } else if (actionType === 2 && groupStatus === 2) {
          this.user.joinStatus = 5;
          this.refreshMemberList();
        }
      }

      this.uiFlag.isJoinLoading = false;
    });
  }

  /**
   * 導向使用者點選的群組頁面
   * @param groupId {string}
   * @event click
   */
  handleNavigation(groupId: string) {
    if (this.uiFlag.portalMode) {
      this.router.navigateByUrl(
        `/group-info/${this.hashIdService.handleGroupIdEncode(groupId)}/group-introduction`
      );
    } else {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
          groupId
        )}/group-introduction`
      );
    }
  }

  /**
   * 根據使用者點選的頁面顯示內容
   * @param e {MouseEvent}
   * @param page {GroupChildPage}-子頁面
   * @param tagIdx {number}-tag的顯示序
   */
  handleShowContent(e: MouseEvent, page: GroupChildPage, tagIdx: number) {
    e.stopPropagation();
    const pageString = this.getGroupPageString(page);
    this.router.navigateByUrl(
      `/dashboard/group-info/${this.currentGroupInfo.hashGroupId}/${pageString}`
    );
    this.uiFlag.currentPage = page;
    this.uiFlag.currentTagIndex = tagIdx;
    this.uiFlag.showMorePageOpt = false;
    this.getBtnPosition(tagIdx);
    this.scrollPage(page);
  }

  /**
   * 取得頁面tag位置
   * @param tagIdx {number}-tag的顯示序
   * @author kidin-1091102
   */
  getBtnPosition(tagIdx: number) {
    if (this.uiFlag.divideIndex === null || tagIdx < this.uiFlag.divideIndex) {
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
   */
  scrollPage(page: GroupChildPage) {
    const mainBodyEle = document.querySelector('.main-body');
    if (page === GroupChildPage.groupIntroduction) {
      mainBodyEle.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const pageListBar = document.querySelectorAll('.info-pageListBar')[0] as HTMLElement;
      const pageListBarTop = pageListBar.offsetTop;
      mainBodyEle.scrollTo({ top: pageListBarTop, behavior: 'smooth' });
    }
  }

  /**
   * 取得"更多"按鈕的大小和位置，使active bar可以對齊
   * @author kidin-1091102
   */
  getSeeMorePosition() {
    setTimeout(() => {
      const pageListBar = this.pageListBar.nativeElement,
        seeMoreTag = this.seeMore.nativeElement;
      this.uiFlag.barWidth = seeMoreTag.clientWidth;
      this.uiFlag.barPosition =
        seeMoreTag.getBoundingClientRect().left - pageListBar.getBoundingClientRect().left;
    });
  }

  /**
   * 顯示或隱藏更多列表
   * @param e {MouseEvent}
   * @author kidin-1091030
   */
  handleShowMorePageOpt(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showMorePageOpt = !this.uiFlag.showMorePageOpt;
  }

  /**
   * 顯示分享群組qrcode
   * @author kidin-1091102
   */
  openShareGroupInfoDialog() {
    const {
      groupId,
      groupLevel,
      groupDetail: { groupName, groupRootInfo },
    } = this.currentGroupInfo;
    let shareName: string;
    switch (groupLevel) {
      case 30:
        shareName = groupName;
        break;
      case 40:
        shareName = `${groupRootInfo[2].brandName}-${groupName}`;
        break;
      case 60:
        shareName = `${groupRootInfo[2].brandName}-${groupRootInfo[3].branchName}-${groupName}`;
        break;
    }

    this.dialog.open(ShareGroupInfoDialogComponent, {
      hasBackdrop: true,
      data: {
        url: `${location.origin}/group-info/${this.hashIdService.handleGroupIdEncode(groupId)}`,
        title: this.translate.instant('universal_operating_share'),
        shareName: shareName || '',
        cancelText: this.translate.instant('universal_operating_confirm'),
      },
    });
  }

  /**
   * 開啟圖片選擇器
   *
   * @author kidin-1091123
   */
  openImgSelector(type: 'icon' | 'scenery') {
    if (type === 'icon') {
      this.uiFlag.openIconImgSelector = true;
    } else {
      this.uiFlag.openSceneryImgSelector = true;
    }
  }

  /**
   * 關閉圖片選擇器
   * @author kidin-1091124
   */
  closeSelector(e: any) {
    if (e.action === 'complete') {
      this.editImage.edited = true;
      if (e.img.albumType === AlbumType.groupIcon) {
        this.editImage.icon.origin = e.img.origin;
        this.editImage.icon.base64 = e.img.base64;
      } else {
        this.editImage.scenery.origin = e.img.origin;
        this.editImage.scenery.base64 = e.img.base64;
        this.uiFlag.hideScenery = false;
      }
    }

    this.uiFlag.openIconImgSelector = false;
    this.uiFlag.openSceneryImgSelector = false;
  }

  /**
   * 若圖片不存在或載入錯誤則隱藏該元素
   * @author kidin-1091204
   */
  sceneryError() {
    console.error("Can't get group scenery.");
    this.uiFlag.hideScenery = true;
  }

  /**
   * 轉導至建立新訊息頁面
   */
  navigateNewMailPage() {
    const groupId = this.route.snapshot.paramMap.get('groupId');
    const {
      stationMail: { home, newMail },
    } = appPath;
    const { messageReceiverId, messageReceiverType } = QueryString;
    this.router.navigateByUrl(
      `/dashboard/${home}/${newMail}?${messageReceiverId}=${groupId}&${messageReceiverType}=g`
    );
  }

  /**
   * 取得頁面字串對應的enum code
   */
  getGroupPageCode(pageString: string) {
    switch (pageString) {
      case 'group-introduction':
        return GroupChildPage.groupIntroduction;
      case 'myclass-report':
        return GroupChildPage.myclassReport;
      case 'class-analysis':
        return GroupChildPage.classAnalysis;
      case 'sports-report':
        return GroupChildPage.sportsReport;
      case 'life-tracking':
        return GroupChildPage.lifeTracking;
      case 'cloudrun-report':
        return GroupChildPage.cloudrunReport;
      case 'group-architecture':
        return GroupChildPage.groupArchitecture;
      case 'admin-list':
        return GroupChildPage.adminList;
      case 'member-list':
        return GroupChildPage.memberList;
      case 'device-list':
        return GroupChildPage.deviceList;
      case 'commerce-plan':
        return GroupChildPage.commercePlan;
      case 'operation-report':
        return GroupChildPage.operationReport;
      default:
        return GroupChildPage.groupIntroduction;
    }
  }

  /**
   * 取得頁面字串對應的enum code
   */
  getGroupPageString(pageCode: GroupChildPage): string {
    switch (pageCode) {
      case GroupChildPage.groupIntroduction:
        return 'group-introduction';
      case GroupChildPage.myclassReport:
        return 'myclass-report';
      case GroupChildPage.classAnalysis:
        return 'class-analysis';
      case GroupChildPage.sportsReport:
        return 'sports-report';
      case GroupChildPage.lifeTracking:
        return 'life-tracking';
      case GroupChildPage.cloudrunReport:
        return 'cloudrun-report';
      case GroupChildPage.groupArchitecture:
        return 'group-architecture';
      case GroupChildPage.adminList:
        return 'admin-list';
      case GroupChildPage.memberList:
        return 'member-list';
      case GroupChildPage.deviceList:
        return 'device-list';
      case GroupChildPage.commercePlan:
        return 'commerce-plan';
      case GroupChildPage.operationReport:
        return 'operation-report';
      default:
        return 'group-introduction';
    }
  }

  /**
   * 1. 移除訂閱
   * @author kidin-20200710
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}

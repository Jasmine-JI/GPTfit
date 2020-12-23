import { Component, OnInit, OnDestroy, ElementRef, AfterViewChecked, ViewChild } from '@angular/core';
import { fromEvent, Subscription, Subject, forkJoin } from 'rxjs';
import { takeUntil, tap, switchMap, map } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ShareGroupInfoDialogComponent } from '../../../../shared/components/share-group-info-dialog/share-group-info-dialog.component';
import { GroupDetailInfo, UserSimpleInfo, EditMode } from '../../models/group-detail';
import moment from 'moment';
import { UtilsService } from '../../../../shared/services/utils.service';
import { GroupService } from '../../services/group.service';
import { HashIdService } from '../../../../shared/services/hash-id.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { v5 as uuidv5 } from 'uuid';
import { ImageUploadService } from '../../services/image-upload.service';
import { AlbumType } from '../../../../shared/models/image';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-group-info-v2',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss']
})
export class GroupInfoComponent implements OnInit, AfterViewChecked, OnDestroy {

  @ViewChild('navSection') navSection: ElementRef;
  @ViewChild('pageListBar') pageListBar: ElementRef;
  @ViewChild('seeMore') seeMore: ElementRef;
  @ViewChild('groupHeaderDescription') groupHeaderDescription: ElementRef;

  private ngUnsubscribe = new Subject();

  pageResize: Subscription;
  clickEvent: Subscription;

  /**
   * 使用者在此群組的身份資料
   */
  user = <UserSimpleInfo>{
    nickname: '',
    userId: null,
    token: '',
    accessRight: [],
    joinStatus: 2,
    isGroupAdmin: false
  };

  /**
   * 操控頁面UI的各個flag
   */
  uiFlag = {
    windowInnerWidth: null,
    showMorePageOpt: false,
    divideIndex: 99,
    currentPage: 'group-introduction',
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
    isJoinLoading: false
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
    commerceInfo: <any>{}
  };

  /**
   * 群組子頁面清單
   */
  childPageList: Array<string> = [];

  /**
   * 儲存子頁面清單各選項按鈕寬度
   */
  perPageOptSize = {
    total: 0,
    perSize: []
  };

  /**
   * 變更照片
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
  };

  constructor(
    private translate: TranslateService,
    private groupService: GroupService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private dialog: MatDialog,
    private imageUploadService: ImageUploadService
  ) {}

  /**
   * 1. 確認視窗大小
   * 2. 訂閱視窗大小
   * @author kidin-20200710
   */
  ngOnInit(): void {
    this.getToken();
    this.checkQueryString(location.search);
    this.detectParamChange();
    this.detectGroupIdChange();
    this.handlePageResize();
    this.handleSideBarSwitch();
    this.checkEditMode();
  }

  ngAfterViewChecked() {}

  /**
   * 偵測瀏覽器是否改變大小
   * @author kidin-20200710
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    this.pageResize = page.pipe(
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
    this.groupService.getRxSideBarMode().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {

      setTimeout(() => {
        this.getBtnPosition(this.uiFlag.currentTagIndex);
      }, 250); // 待sidebar動畫結束再計算位置
      
    })

  }

  /**
   * 當進入編輯或建立群組模式時，讓佈景或圖片進入可編輯模式
   * @author kidin-1091123
   */
  checkEditMode() {
    this.groupService.getRxEditMode().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
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
      let imgArr = [];

      const formData = new FormData();
      formData.set('token', this.utils.getToken());
      formData.set('targetType', '2');

      // 群組icon
      if (this.editImage.icon.base64 !== null) {
        const fileName = this.createFileName(imgArr.length);
        imgArr.unshift({
          albumType: 11,
          fileNameFull: `${fileName}.jpg`
        })

        formData.append('file', this.base64ToFile(11, this.editImage.icon.base64, fileName));
      }

      // 群組佈景
      if (this.editImage.scenery.base64 !== null) {   
        const fileName = this.createFileName(imgArr.length);
        imgArr.unshift({
          albumType: 12,
          fileNameFull: `${fileName}.jpg`
        })

        formData.append('file', this.base64ToFile(12, this.editImage.scenery.base64, fileName));
      }

      formData.set('img', JSON.stringify(imgArr));

      if (this.uiFlag.editMode === 'edit') {
        formData.set('targetGroupId', this.currentGroupInfo.groupDetail.groupId);
        this.sendImgUploadReq(formData, this.currentGroupInfo.groupDetail.groupId);
      } else if (this.uiFlag.editMode === 'create') {
        const newGroupId = this.groupService.getNewGroupId();
        formData.set('targetGroupId', newGroupId);
        this.sendImgUploadReq(formData, newGroupId);
      }

    } else if (this.uiFlag.editMode === 'create' && editMode === 'complete') {
      this.closeCreateMode();
      this.handleNavigation(this.groupService.getNewGroupId());
    } else if (editMode === 'complete') {
      this.getGroupNeedInfo();
      this.groupService.setEditMode('close');
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
    this.imageUploadService.addImg(formData).subscribe(res => {

      if (res.processResult.resultCode !== 200) {
        this.utils.openAlert('Image upload error.');
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.initImgSetting();

        if (this.uiFlag.editMode === 'create') {
          this.closeCreateMode();
          this.handleNavigation(groupId);
        } else {
          this.getGroupNeedInfo();
          this.groupService.setEditMode('close');
        }
 
      }

    });

  }

  /**
   * 建立圖片名稱
   * @param length {number}-檔案序列
   * @author kidin-1091125
   */
  createFileName(length: number) {
    const nameSpace = uuidv5('https://www.gptfit.com', uuidv5.URL),
          keyword = `${
            moment().valueOf().toString()}${
            length}${
            this.currentGroupInfo.groupDetail.groupId.split('-').join('')
          }`;

    return uuidv5(keyword, nameSpace);
  }

  /**
   * 將base64的圖片轉為檔案格式
   * @param albumType {number}-圖片類型
   * @param base64 {string}-base64圖片
   * @param fileName {檔案名稱}
   * @author kidin-1091127
   */
  base64ToFile(albumType: AlbumType, base64: string, fileName: string): File {
    const blob = this.utils.dataUriToBlob(albumType, base64);
    return new File([blob], `${fileName}.jpg`, {type: 'image/jpeg'});
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
        base64: null
      },
      scenery: {
        origin: null,
        base64: null
      }
    };
  }

  /**
   * 偵測全域點擊事件，以收納"更多"選單
   * @author kidin-20201112
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
   * 確認url的query string
   * @param query {string}-url query string
   * @author kidin-1091106
   */
  checkQueryString(query: string) {
    if (query.indexOf('?') > -1) {
      const queryArr = query.split('?')[1].split('&');
      queryArr.forEach(_query => {
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
    this.router.events.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(event => {

      if (event instanceof NavigationEnd) {
        this.checkQueryString(event.url);
        this.getCurrentContentPage(event);
        this.getBtnPosition(this.uiFlag.currentTagIndex);
      }

    })

  }

  /**
   * 處理切換不同群組的事件
   * @author kidin-1091110
   */
  detectGroupIdChange() {
    this.route.params.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.detectGroupChange();
    });

  }

  /**
   * 根據權限和群組類別決定是否開啟建立群組模式
   * @param type {string}-欲新建的群組type
   * @author kidin-1091106
   */
  openCreateMode(type: string) {
    if (this.user.accessRight[0]) {

      switch (type) {
        case 'brand':
          if (this.user.accessRight[0] <= 29) {
            this.uiFlag.createLevel = 30;
          }

          break;
        case 'branch':
          if (this.user.accessRight[0] <= 30) {
            this.uiFlag.createLevel = 40;
          }

          break;
        case 'coach':
        case 'department':
          if (this.user.accessRight[0] <= 40) {
            this.uiFlag.createLevel = 60;
          }

          break;
        case 'teacher':
          if (this.user.accessRight[0] <= 40) {
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
    this.groupService.setEditMode('close');

    // 移除query string，避免create mode被重複開啟
    const newUrl = `${location.origin}${location.pathname}`;
    window.history.pushState({path: newUrl}, '', newUrl);
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
      if (window.innerWidth >= 1000 && window.innerWidth <= 1390) {
        reservedSpace = 270; // sidebar展開所需的空間
      }

      if (navSectionWidth < this.perPageOptSize.total + reservedSpace) {
        const titleSizeList = this.perPageOptSize.perSize;
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

      this.getBtnPosition(this.uiFlag.currentTagIndex);
    });
    
  }

  /**
   * 取得token
   * @author kidin-1090716
   */
  getToken() {
    this.user.token = this.utils.getToken() || '';
    if (location.pathname.indexOf('dashboard') < 0 && this.user.token !== '') {
      this.router.navigateByUrl(`/dashboard${location.pathname}${location.search}`);
    } else if (location.pathname.indexOf('dashboard') < 0) {
      this.uiFlag.portalMode = true;
    } else {
      this.uiFlag.portalMode = false;
    }

  }

  /**
   * 切換不同群組頁面即更新群組和使用者相關資訊
   * @author kidin-10812217
   */
  detectGroupChange() {
    if (this.currentGroupInfo.hashGroupId !== this.route.snapshot.paramMap.get('groupId')) {
      this.groupService.setEditMode('close');
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
    this.currentGroupInfo.hashGroupId = this.route.snapshot.paramMap.get('groupId');
    this.currentGroupInfo.groupId = this.hashIdService.handleGroupIdDecode(
      this.currentGroupInfo.hashGroupId
    );

    this.currentGroupInfo.groupLevel = this.utils.displayGroupLevel(this.currentGroupInfo.groupId);
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
      avatarType: 3
    };

    const groupIdArr = this.currentGroupInfo.groupId.split('-');
    groupIdArr.length = 3;

    /**
     * api 1115 request body
     */
    const commerceBody = {
      token: this.user.token,
      groupId: `${groupIdArr.join('-')}-0-0-0`
    };

    /**
     * api 1103 request body
     */
    const childGroupBody = {
      token: this.user.token,
      avatarType: 3,
      groupId: this.currentGroupInfo.groupId,
      groupLevel: this.currentGroupInfo.groupLevel,
      infoType: 1
    }

    /**
     * api 1103 request body
     */
    const adminListBody = {
      token: this.user.token,
      avatarType: 3,
      groupId: this.currentGroupInfo.groupId,
      groupLevel: this.currentGroupInfo.groupLevel,
      infoType: 2
    }

    /**
     * api 1103 request body
     */
    const memberListBody = {
      token: this.user.token,
      avatarType: 3,
      groupId: this.currentGroupInfo.groupId,
      groupLevel: this.currentGroupInfo.groupLevel,
      infoType: 3
    }

    this.uiFlag.isLoading = true;
    if (this.uiFlag.portalMode) {
      forkJoin([
        this.groupService.fetchGroupListDetail(detailBody),
        this.groupService.fetchCommerceInfo(commerceBody)
      ]).subscribe(resArr => {
        this.uiFlag.isLoading = false;
        this.uiFlag.hideScenery = false;
        this.handleDetail(resArr[0]);
        this.handleCommerce(resArr[1]);
        this.checkUserAccessRight();
        this.initChildPageList();
        this.getCurrentContentPage();
        this.getPerPageOptSize();
      })

    } else {
      forkJoin([
        this.groupService.fetchGroupListDetail(detailBody),
        this.groupService.fetchCommerceInfo(commerceBody),
        this.groupService.fetchGroupMemberList(childGroupBody),
        this.groupService.fetchGroupMemberList(adminListBody),
        this.groupService.fetchGroupMemberList(memberListBody)
      ]).subscribe(resArr => {
        this.uiFlag.isLoading = false;
        this.uiFlag.hideScenery = false;
        this.handleDetail(resArr[0]);
        this.handleCommerce(resArr[1]);
        this.handleMemberList(resArr[2], resArr[3], resArr[4]);
        this.checkUserAccessRight();
        this.initChildPageList();
        this.getCurrentContentPage();
        this.getPerPageOptSize();
      })

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
      infoType: 3
    }

    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode !== 200) {
        this.utils.openAlert(errMsg);
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.groupService.setNormalMemberList(res.info.groupMemberInfo);
      }

    })

  }

  /**
   * 處理api 1102的response
   * @param res {any}-api 1102 response
   * @author kidin-1091104
   */
  handleDetail(res: any) {
    if (res.resultCode !== 200) {

      if (this.currentGroupInfo.groupId !== '0-0-0-0-0-0') {
        this.utils.openAlert(errMsg);
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        const rootGroupDetail = {
          brandType: this.currentGroupInfo.brandType,
          classActivityType: [],
          coachType: '',
          commerceStatus: 1,
          expired: false,
          groupDesc: '',
          groupIcon: '',
          groupThemeImgUrl: '',
          groupId: "0-0-0-0-0-0",
          groupName: '',
          groupRootInfo: [null, null],
          groupStatus: 2,
          groupVideoUrl: '',
          rtnMsg: '',
          selfJoinStatus: 5,
          shareActivityToMember: {disableAccessRight: Array(0), enableAccessRight: Array(0), switch: "2"},
          shareAvatarToMember: {disableAccessRight: Array(0), enableAccessRight: Array(0), switch: "1"},
          shareReportToMember: {disableAccessRight: Array(0), enableAccessRight: Array(0), switch: "2"}
        }

        this.groupService.saveGroupDetail(rootGroupDetail);
      }

    } else {
      this.user.joinStatus = res.info.selfJoinStatus;
      this.currentGroupInfo.groupDetail = res.info;
      this.groupService.saveGroupDetail(res.info);
      this.checkGroupResLength();
    }

  }

  /**
   * 處理api 1102的response
   * @param res {any}-api 1115 response
   * @author kidin-1091104
   */
  handleCommerce(res: any) {
    if (res.resultCode !== 200) {
      this.utils.openAlert(errMsg);
      console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
    } else {

      if (moment(res.info.commercePlanExpired).valueOf() < moment().valueOf()) {
        Object.assign(res.info, {expired: true});
      } else {
        Object.assign(res.info, {expired: false});
        
      }

      this.currentGroupInfo.commerceInfo = res.info;
      this.groupService.saveCommerceInfo(res.info);
    }

  }

  /**
   * 處理api 1103
   * @param adminRes {any}-管理員清單
   * @param memberRes {any}-一般成員清單
   * @author kidin-1091209
   */
  handleMemberList(childGroupRes: any, adminRes: any, memberRes: any) {
    if (childGroupRes.resultCode !== 200 || adminRes.resultCode !== 200 || memberRes.resultCode !== 200) {
      this.utils.openAlert(errMsg);
      console.log(`${childGroupRes.resultCode}: Api ${childGroupRes.apiCode} ${childGroupRes.resultMessage}`);
      console.log(`${adminRes.resultCode}: Api ${adminRes.apiCode} ${adminRes.resultMessage}`);
      console.log(`${memberRes.resultCode}: Api ${memberRes.apiCode} ${memberRes.resultMessage}`);
    } else {

      const groupLevel = this.utils.displayGroupLevel(this.currentGroupInfo.groupId);
      if (groupLevel <= 30) {
        Object.assign(this.currentGroupInfo.groupDetail, {branchNum: childGroupRes.info.subGroupInfo.branches.length});
      }

      if (groupLevel <= 40) {
        Object.assign(this.currentGroupInfo.groupDetail, {coachNum: childGroupRes.info.subGroupInfo.coaches.length});
      }
      
      Object.assign(childGroupRes.info.subGroupInfo, {groupId: this.currentGroupInfo.groupId});
      this.groupService.setAllLevelGroupData(childGroupRes.info.subGroupInfo);
      this.groupService.setAdminList(adminRes.info.groupMemberInfo);
      this.groupService.setNormalMemberList(memberRes.info.groupMemberInfo);

      adminRes.info.groupMemberInfo = adminRes.info.groupMemberInfo.filter(_admin => _admin.groupId === this.currentGroupInfo.groupId);
      Object.assign(this.currentGroupInfo.groupDetail, {adminNum: adminRes.info.groupMemberInfo.length});
      Object.assign(this.currentGroupInfo.groupDetail, {memberNum: memberRes.info.groupMemberInfo.length});
      this.groupService.saveGroupDetail(this.currentGroupInfo.groupDetail);
    }

  }

  /**
   * 藉由rx取得已儲存的資訊
   * @author kidin-1091105
   */
  getRxGroupNeedInfo() {
    forkJoin([
      this.groupService.getRxGroupDetail(),
      this.groupService.getRxCommerceInfo()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      this.user.joinStatus = (resArr[0] as any).info.selfJoinStatus;
      this.currentGroupInfo.groupDetail = (resArr[0] as any).info;
      this.currentGroupInfo.commerceInfo = (resArr[1] as any).info;
      this.checkUserAccessRight();
      this.initChildPageList();
      this.getCurrentContentPage();
      this.getPerPageOptSize();
      this.checkGroupResLength();
    })
    
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
        this.uiFlag.currentPage = 'group-introduction';
        this.uiFlag.currentTagIndex = 0;
        this.handleNavigation(this.currentGroupInfo.groupId);
      } else if (urlArr.length === 5) {
        this.uiFlag.currentPage = urlArr[urlArr.length - 1].split('?')[0];
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
      this.groupService.checkAccessRight(this.currentGroupInfo.groupId).pipe(
        switchMap(res => this.userProfileService.getRxUserProfile().pipe(
          map(resp => {
            const userObj = {};
            Object.assign(userObj, {accessRight: res});
            Object.assign(userObj, {nickname: (resp as any).nickname});
            Object.assign(userObj, {userId: (resp as any).userId});
            return userObj;
          })
        )),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(res => {
        this.user.accessRight = (res as any).accessRight;
        this.user.nickname = (res as any).nickname;
        this.user.userId = (res as any).userId;
        this.user.isGroupAdmin = this.user.accessRight.some(_accessRight => {
          if (this.currentGroupInfo.groupLevel === 60) {
            return _accessRight === 50 || _accessRight === 60;
          } else  {
            return _accessRight === this.currentGroupInfo.groupLevel;
          }

        });

        this.groupService.saveUserSimpleInfo(this.user);
      })

    }

  }

  /**
   * 根據群組類別、群組階層、群組經營狀態、使用者權限等，顯示可點選的頁面
   * @author kidin-1091104
   */
  initChildPageList() {

    const groupDetail = this.currentGroupInfo.groupDetail,
          commerceInfo = this.currentGroupInfo.commerceInfo;

    if (this.uiFlag.portalMode) {
      this.childPageList = [
        'group-introduction'
      ];
    } else if (
      groupDetail.brandType === 1
      && this.currentGroupInfo.groupLevel === 60
      && !commerceInfo.expired
      && +commerceInfo.commerceStatus === 1
      && this.currentGroupInfo.groupDetail.groupStatus !== 6
      && this.user.accessRight[0] <= 50
    ) {
      this.childPageList = [
        'group-introduction',
        'myclass-report',
        'class-analysis',
        // 'cloudrun-report',
        'member-list',
        'group-architecture',
        'admin-list'
      ];
    } else if (
      groupDetail.brandType === 1
      && this.currentGroupInfo.groupLevel === 60
      && !commerceInfo.expired
      && +commerceInfo.commerceStatus === 1
      && this.currentGroupInfo.groupDetail.groupStatus !== 6
    ) {
      this.childPageList = [
        'group-introduction',
        'myclass-report',
        // 'cloudrun-report',
        'member-list',
        'group-architecture',
        'admin-list'
      ];
    } else if (
      groupDetail.brandType === 2
      && !commerceInfo.expired
      && +commerceInfo.commerceStatus === 1
      && this.currentGroupInfo.groupDetail.groupStatus !== 6
    ) {
      this.childPageList = [
        'group-introduction',
        'sports-report',
        'life-tracking',
        // 'cloudrun-report',
        'member-list',
        'group-architecture',
        'admin-list'
      ];
    } else {
      this.childPageList = [
        'group-introduction',
        'member-list',
        'group-architecture',
        'admin-list'
      ];
    }

    if (this.currentGroupInfo.groupLevel === 30 && (this.user.accessRight[0] <= 29 || this.user.isGroupAdmin)) {
      this.childPageList.push('commerce-plan');
    }
    
  }

  /**
   * 取得子頁面清單各選項按鈕寬度
   * @author kidin-1091030
   */
  getPerPageOptSize() {

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
   * @author kidin-1091110
   */
  initPageOptSize() {
    this.perPageOptSize = {
      total: 0,
      perSize: []
    };
  }

  /**
   * 加入群組並顯示隱私權
   * @author kidin-1091223
   */
  joinGroup() {
    this.translate.get('hollow world').subscribe(() => {
      const bodyText = this.translate.instant('universal_group_joinClassStatement', {
          'object': this.translate.instant('universal_privacy_myGym')
        }
      );

      return this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: this.translate.instant('universal_group_disclaimer'),
          body: bodyText,
          confirmText: this.translate.instant('universal_operating_agree'),
          cancelText: this.translate.instant('universal_operating_disagree'),
          onConfirm: () => {
            this.handleJoinGroup(1);
          }
          
        }

      });

    });

  }

  /**
   * 使用者加入或退出群組
   * @event click
   * @author kidin-1090811
   */
  handleJoinGroup(actionType: number) {
    if (this.user.token.length === 0) {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(this.currentGroupInfo.groupId)}/group-introduction`
      );
    } else {

      const body = {
        token: this.user.token,
        groupId: this.currentGroupInfo.groupId,
        brandType: this.currentGroupInfo.groupDetail.brandType,
        actionType
      };

      this.uiFlag.isJoinLoading = true;
      this.groupService.actionGroup(body).subscribe(res => {
        if (res.resultCode !== 200) {
          this.utils.openAlert(errMsg);
          console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        } else {

          if (this.currentGroupInfo.groupDetail.groupStatus === 1 || this.user.joinStatus === 2) {
            this.userProfileService.refreshUserProfile({token: this.user.token});
            this.getGroupNeedInfo();
          } else if (actionType === 1 && this.currentGroupInfo.groupDetail.groupStatus === 2) {
            this.user.joinStatus = 1;
            this.refreshMemberList();
          } else if (actionType === 2 && this.currentGroupInfo.groupDetail.groupStatus === 2) {
            this.user.joinStatus = 5;
            this.refreshMemberList();
          }

        }

        this.uiFlag.isJoinLoading = false;
      });

    }

  }

  /**
   * 導向使用者點選的群組頁面
   * @param groupId {string}
   * @event click
   * @author kidin-1090811
   */
  handleNavigation(groupId: string) {
    if (this.uiFlag.portalMode) {
      this.router.navigateByUrl(
        `/group-info/${this.hashIdService.handleGroupIdEncode(groupId)}/group-introduction`
      );
    } else {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(groupId)}/group-introduction`
      );

    }

  }

  /**
   * 根據使用者點選的頁面顯示內容
   * @param e {MouseEvent}
   * @param page {string}-子頁面
   * @param tagIdx {number}-tag的顯示序
   * @author kidin-1090811
   */
  handleShowContent(e: MouseEvent, page: string, tagIdx: number) {
    e.stopPropagation();
    this.router.navigateByUrl(`/dashboard/group-info/${this.currentGroupInfo.hashGroupId}/${page}`);
    this.uiFlag.currentPage = page;
    this.uiFlag.currentTagIndex = tagIdx;
    this.uiFlag.showMorePageOpt = false;
    this.getBtnPosition(tagIdx);
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
        this.uiFlag.barWidth = tagPosition[tagIdx].clientWidth;
        let frontSize = 0;
        for (let i = 0; i < tagIdx; i++) {
          frontSize += tagPosition[i].clientWidth;
        }

        this.uiFlag.barPosition = frontSize;
      });
      
    } else {
      this.getSeeMorePosition();
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
      this.uiFlag.barPosition = seeMoreTag.getBoundingClientRect().left - pageListBar.getBoundingClientRect().left;
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
    let totalGroupName:string;
    switch (this.currentGroupInfo.groupLevel) {
      case 30:
        totalGroupName = this.currentGroupInfo.groupDetail.groupName;
        break;
      case 40:
        totalGroupName = `${
          this.currentGroupInfo.groupDetail.groupRootInfo[2].brandName
        }-${
          this.currentGroupInfo.groupDetail.groupName
        }`;
        break;
      case 60:
        totalGroupName = `${
          this.currentGroupInfo.groupDetail.groupRootInfo[2].brandName
        }-${
          this.currentGroupInfo.groupDetail.groupRootInfo[3].branchName
        }-${
          this.currentGroupInfo.groupDetail.groupName
        }`;
        break;
    }

    this.dialog.open(ShareGroupInfoDialogComponent, {
      hasBackdrop: true,
      data: {
        url: `${location.origin}/group-info/${this.hashIdService.handleGroupIdEncode(this.currentGroupInfo.groupId)}`,
        title: this.translate.instant('universal_operating_share'),
        totalGroupName: totalGroupName || '',
        cancelText: this.translate.instant('universal_operating_cancel')
      }

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
      if (e.img.albumType === 11) {
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
    console.log('image Error');
    this.uiFlag.hideScenery = true;
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

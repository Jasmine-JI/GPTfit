import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { QrcodeService } from '../../../portal/services/qrcode.service';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subject, fromEvent, Subscription } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import dayjs, { Dayjs } from 'dayjs';
import {
  UserService,
  GlobalEventsService,
  AuthService,
  Api70xxService,
  HintDialogService,
  ApiCommonService,
} from '../../../../core/services';
import { TranslateService } from '@ngx-translate/core';
import { langList } from '../../../../shared/models/i18n';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileInfo } from '../../../../shared/models/user-profile-info';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { PaginationSetting } from '../../../../shared/models/pagination';
import {
  setLocalStorageObject,
  getLocalStorageObject,
  removeLocalStorageObject,
} from '../../../../core/utils';
import { AccessRight } from '../../../../shared/enum/accessright';

type DisplayPage = 'fitPair' | 'system' | 'myDevice';
type MainContent = 'info' | 'management' | 'odometer' | 'log' | 'register';

const errMsg = 'Error! Please try again later.';

@Component({
  selector: 'app-device-info',
  templateUrl: './device-info.component.html',
  styleUrls: ['./device-info.component.scss'],
})
export class DeviceInfoComponent implements OnInit, OnDestroy {
  @ViewChild('navSection') navSection: ElementRef;
  @ViewChild('pageListBar') pageListBar: ElementRef;
  @ViewChild('seeMore') seeMore: ElementRef;

  private ngUnsubscribe = new Subject();
  clickEvent: Subscription;
  pageResize: Subscription;
  scrollEvent: Subscription;

  /**
   * ui上會用到的各個flag
   */
  uiFlag = {
    displayPage: <DisplayPage>null,
    progress: 0,
    overManufactureDate: false,
    checkSumError: false,
    windowInnerWidth: null,
    showMorePageOpt: false,
    divideIndex: 99,
    currentPage: <MainContent>'info',
    currentTagIndex: 0,
    barPosition: 0,
    barWidth: 0,
    openAppDl: [],
    showFitPairSettingDialog: false,
    fitPairChanged: false,
    isPortalMode: !location.pathname.includes('dashboard'),
  };

  /**
   * 裝置相關資訊
   */
  deviceInfo = {
    sn: null,
    cs: null,
    modelTypeID: null,
    modelTypeName: null,
    modelName: null,
    modelImg: null,
    scenery: null,
    mainApp: null,
    secondaryApp: null,
    deviceEnableDate: null,
    manufactureDate: null,
    qrURL: null,
    manual: {},
    relatedLinks: {},
  };

  /**
   * fitPair相關資訊
   */
  fitPairInfo = {
    status: null,
    type: null,
    isFitPaired: false,
    warrantyStatus: null,
    currentPair: {
      id: null,
      name: null,
      icon: null,
    },
    deviceBond: {
      id: null,
      name: null,
      date: null,
      icon: null,
    },
  };

  /**
   * 裝置日誌日期範圍
   */
  logDate = {
    filterStartTime: dayjs().subtract(6, 'month').format('YYYY-MM-DDT00:00:00.000Z'),
    filterEndTime: dayjs().format('YYYY-MM-DDT23:59:59Z'),
  };

  /**
   * 裝置日誌內容
   */
  equipmentLog = [];

  /**
   * 子頁面清單
   */
  childPageList: Array<MainContent> = ['info'];

  /**
   * 儲存子頁面清單各選項按鈕寬度
   */
  perPageOptSize = {
    total: 0,
    perSize: [],
  };

  /**
   * 頁碼設定
   */
  pageSetting: PaginationSetting = {
    totalCounts: 0,
    pageIndex: 0,
    onePageSize: 10,
  };

  currentLang: string;
  userId: number = null;
  systemAccessRight = AccessRight.guest;
  readonly imgStoragePath = `http://${
    location.hostname.includes('192.168.1.235') ? 'app.alatech.com.tw' : location.hostname
  }/app/public_html/products`;
  readonly appDlImgDomain = 'https://app.alatech.com.tw/app/public_html/products/img/';
  readonly onePageSizeOpt = [10, 30, 50];
  readonly AccessRight = AccessRight;

  constructor(
    private route: ActivatedRoute,
    private qrcodeService: QrcodeService,
    private api70xxService: Api70xxService,
    private userService: UserService,
    private translateService: TranslateService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private auth: AuthService,
    private globalEventsService: GlobalEventsService,
    private hintDialogService: HintDialogService,
    private apiCommonService: ApiCommonService
  ) {}

  ngOnInit(): void {
    this.checkUrl();
    this.checkLang();
    this.handlePageResize();
    this.handleLanguageChange();
    this.handleScroll();
    this.handleSideBarSwitch();
    this.getNeedInfo(this.uiFlag.displayPage);
  }

  /**
   * 確認目前url pathname與query string
   * @author kidin-1100701
   */
  checkUrl() {
    const { pathname, search } = location;
    if (pathname.includes('pair')) {
      this.uiFlag.displayPage = 'fitPair';
      this.checkQueryString(search);
    } else if (pathname.includes('system')) {
      this.uiFlag.displayPage = 'system';
      this.deviceInfo.sn = this.route.snapshot.paramMap.get('deviceSN');
    } else {
      this.uiFlag.displayPage = 'myDevice';
      this.deviceInfo.sn = this.route.snapshot.paramMap.get('deviceSN');
    }
  }

  /**
   * 訂閱語言變更事件
   * @author kidin-1100702
   */
  checkLang() {
    this.currentLang = this.translateService.currentLang;
    this.translateService.onLangChange.subscribe((e) => {
      this.currentLang = e.lang;
    });
  }

  /**
   * 從query string取得所需資訊
   * @author kidin-1100701
   */
  checkQueryString(search: string) {
    const query = search.split('?')[1];
    if (query) {
      const queryArr = query.split('&');
      queryArr.forEach((_query) => {
        const [_key, _value] = _query.split('=');
        switch (_key) {
          case 'device_sn':
            this.deviceInfo.sn = _value;
            break;
          case 'cs':
            this.deviceInfo.cs = _value;
            break;
        }
      });

      const { sn, cs } = this.deviceInfo;
      if (sn && cs) {
        this.uiFlag.checkSumError = !this.checkCheckSum(sn, cs);
      }
    }
  }

  /**
   * 偵測瀏覽器是否改變大小
   * @author kidin-20200710
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    this.pageResize = page.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.checkScreenSize();
    });
  }

  /**
   * 偵測語言改變事件
   */
  handleLanguageChange() {
    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.getPerPageOptSize();
    });
  }

  /**
   * 監聽捲動事件，當捲動到tab時，tab固定置頂
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
   * @author kidin-1100908
   */
  checkPageListBarPosition() {
    const pageListBar = document.querySelectorAll('.info-pageListBar')[0] as any,
      headerRow = document.querySelectorAll('.info-headerRow')[0],
      headerDescriptionBlock = document.querySelectorAll('.info-headerDescriptionBlock')[0],
      scenerySection = document.querySelectorAll('.info-scenerySection')[0];
    if (pageListBar && headerDescriptionBlock && scenerySection) {
      const { top: barTop } = pageListBar.getBoundingClientRect(),
        { bottom: descBottom } = headerRow.getBoundingClientRect(),
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

      if (this.uiFlag.isPortalMode) {
        const cardSection = document.querySelectorAll('.cardSection')[0],
          { left } = cardSection.getBoundingClientRect();
        pageListBar.style.left = `${left}px`;
      }
    }
  }

  /**
   * 依瀏覽器大小將超出邊界的清單進行收納
   * @author kidin-20200714
   */
  checkScreenSize() {
    // 確認多國語系載入後再計算按鈕位置
    this.translateService
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
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
   * 取得子頁面清單各選項按鈕寬度
   * @author kidin-1091030
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
      menuList.forEach((_menu) => {
        this.perPageOptSize.perSize.push(_menu.clientWidth);
        this.perPageOptSize.total += _menu.clientWidth;
      });

      this.checkScreenSize();
    });
  }

  /**
   * 將perPageOptSize參數進行初始化
   * @author kidin-1091110
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
   * 根據使用者點選的頁面顯示內容
   * @param e {MouseEvent}
   * @param page {string}-子頁面
   * @param tagIdx {number}-tag的顯示序
   * @author kidin-1090811
   */
  handleShowContent(e: MouseEvent, page: MainContent, tagIdx: number) {
    e.stopPropagation();
    this.uiFlag.currentPage = page;
    this.uiFlag.currentTagIndex = tagIdx;
    this.uiFlag.showMorePageOpt = false;
    this.getBtnPosition(tagIdx);
    switch (page) {
      case 'info': {
        const mainBodyEle = document.querySelector('.main__container');
        mainBodyEle.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      }
      case 'log':
        this.getProductLog();
        break;
    }
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
   * 根據所在頁面所需資訊，call相對應api
   * @author kidin-1100702
   */
  getNeedInfo(displayPage: DisplayPage) {
    const token = this.auth.token;
    const { sn, cs } = this.deviceInfo;
    const productInfoBody = {
      queryArray: [sn],
      queryType: 1,
      token,
    };
    let apiList = [
      this.api70xxService.fetchGetProductInfo(productInfoBody),
      this.userService.getUser().rxUserProfile,
    ];
    switch (displayPage) {
      case 'fitPair': {
        const uploadDeviceInfoBody = {
          token,
          uploadEquipmentSN: sn,
          verifyCode: cs,
          deviceDistance: '',
          deviceFWVer: '',
          deviceRFVer: '',
        };

        if (cs) {
          this.uiFlag.overManufactureDate = this.checkUpload(sn);
          if (this.uiFlag.overManufactureDate) {
            apiList = apiList.concat([
              this.api70xxService.fetchUploadDeviceInfo(uploadDeviceInfoBody, sn),
            ]);
          } else {
            this.snackbar.open('尚未出廠（Shipped not yet.）', 'OK', { duration: 3000 });
          }
        }

        this.uiFlag.progress = 30;
        combineLatest(apiList)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((resArr) => {
            const checkResult = this.checkResponse(resArr);
            if (checkResult) {
              const [productInfo, userProfile, fitPairInfo] = resArr;
              this.handleProductInfo(productInfo);
              this.handleUserProfile(userProfile);
              if (fitPairInfo && !this.uiFlag.fitPairChanged) this.handleFitPairInfo(fitPairInfo);
              this.checkActionAfterLogin();
            }

            this.getPerPageOptSize();
            this.uiFlag.progress = 100;
          });
        break;
      }
      default: {
        const getRelativeBody = (token: string, snKeyName: string, sn: string) => {
          return { token, [snKeyName]: sn };
        };

        const getFitPairInfoBody = {
          token,
          pairEquipmentSN: [sn],
          avatarType: 2,
        };

        apiList = apiList.concat([
          this.api70xxService.fetchGetDeviceDetail(
            getRelativeBody(token as string, 'myEquipmentSN', sn)
          ),
          this.api70xxService.fetchGetQRFitPairURL(
            getRelativeBody(token as string, 'equipmentSN', sn)
          ),
          this.api70xxService.fetchFitPairInfo(getFitPairInfoBody),
        ]);

        this.uiFlag.progress = 30;
        combineLatest(apiList)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((resArr) => {
            const checkResult = this.checkResponse(resArr);
            if (checkResult) {
              const [productInfo, userProfile, ...rest] = resArr;
              this.handleUserProfile(userProfile);
              this.handleProductInfo(productInfo);
              this.handleDeviceInfo(rest);
              this.handleChildPageBtn();
              this.checkFitPairSettingMsg();
            }

            this.getPerPageOptSize();
            this.uiFlag.progress = 100;
          });
        break;
      }
    }
  }

  /**
   * 掃Qrcode視同啟用裝置，
   * 但避免出廠前測試造成裝置啟用，
   * 故判斷現在時間是否在出廠時間之後
   * @param sn {string}-裝置序號
   * @author kidin-1100706
   */
  checkUpload(sn: string): boolean {
    const currentTimestamp = dayjs().valueOf();
    const manufactureTimestamp = this.getManufactureTimestamp(sn);
    if (currentTimestamp < manufactureTimestamp) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * 根據sn碼取得出廠日期timestamp
   * @param sn {string}-裝置序號
   * @author kidin-1100708
   */
  getManufactureTimestamp(sn: string): number {
    const baseYear = 1952;
    const manufactureYear = sn.charCodeAt(0) + baseYear;
    const manufactureWeek = +sn.slice(1, 3);
    const manufactureTimestamp =
      dayjs(`${manufactureYear}`, 'YYYY').valueOf() + manufactureWeek * 7 * 86400 * 1000;
    return manufactureTimestamp;
  }

  /**
   * 判斷checkSum是否正確(Q:\APP+CLOUD\Ala center\裝置\文件\QR規則)
   * @param sn {string}-裝置序號
   * @param cs {string}-checksum
   * @author kidin-1100706
   */
  checkCheckSum(sn: string, cs: string): boolean {
    const checkSum = this.qrcodeService.createDeviceChecksum(sn);
    if (checkSum == cs) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * 確認response是否皆回傳200
   * @param res {Array<any>}
   * @author kidin-1100706
   */
  checkResponse(res: Array<any>): boolean {
    let passCheck = true,
      errorMsg = errMsg;
    res.forEach((_res) => {
      if (_res) {
        const { resultCode, resultMessage, apiCode } = _res;
        if (resultCode && resultCode !== 200) {
          passCheck = false;
          if (resultMessage === 'Get QR fit pair URL fail, equipment sn lenght is not 13~14.') {
            errorMsg = 'SN number error.';
          }

          // 7007 異常則隱藏按鈕，其餘畫面正常顯示不跳錯誤訊息
          if (apiCode === 7007) {
            this.uiFlag.checkSumError = true;
            passCheck = true;
          }
        }
      }
    });

    if (!passCheck) this.hintDialogService.openAlert(errorMsg);
    return passCheck;
  }

  /**
   * 儲存user id 和使用者權限
   * @param userProfile {UserProfileInfo}
   * @author kidin-1100709
   */
  handleUserProfile(userProfile: UserProfileInfo) {
    if (userProfile) {
      const { userId, systemAccessright } = this.userService.getUser();
      this.userId = userId;
      this.systemAccessRight = systemAccessright;
    }
  }

  /**
   * 將api資訊處理過後儲存
   * @param res {any}-api 7015 reponse
   * @author kidin-1100702
   */
  handleProductInfo(res: any) {
    const {
      info: { productInfo },
    } = res;
    const { mainApp, secondaryApp, modelImg, modelName, modelTypeID, modelTypeName } =
      productInfo[0];

    if (!modelTypeName) {
      const qrErrMsg = `Can't find this device.<br>Please check sn number.`;
      this.hintDialogService.openAlert(qrErrMsg);
    } else {
      const { sn, cs } = this.deviceInfo;
      this.deviceInfo = {
        sn,
        cs,
        modelTypeID,
        modelTypeName,
        modelName,
        modelImg,
        scenery: null,
        mainApp,
        secondaryApp,
        deviceEnableDate: null,
        manufactureDate: dayjs(this.getManufactureTimestamp(sn)).format('YYYY-MM'),
        qrURL: null,
        manual: {},
        relatedLinks: {},
      };

      // 根據語系儲存相對應連結，以方便擴充語系
      langList.forEach((_lang) => {
        const [langCode, countryCode] = _lang.split('-'),
          upperCtCode = countryCode.toUpperCase(),
          keyLang = `${langCode}-${upperCtCode}`,
          manualKey = `manual_${keyLang}`,
          manual = productInfo[0][manualKey],
          linkKey = `relatedLinks_${keyLang}`,
          link = productInfo[0][linkKey];
        if (manual && manual.length > 0) {
          Object.assign(this.deviceInfo.manual, { [_lang]: manual });
        }

        if (link && link.length > 0) {
          Object.assign(this.deviceInfo.relatedLinks, { [_lang]: link });
        }
      });
    }
  }

  /**
   * 將api資訊處理過後儲存
   * @param res {any}-fitpair頁面所需的api資訊
   * @author kidin-1100702
   */
  handleFitPairInfo(res: any) {
    const { info } = res;
    const { fitPairStatus, fitPairType, fitPairUserId, isFitPaired, warrantyStatus } = info;

    this.fitPairInfo = {
      status: fitPairStatus,
      type: fitPairType,
      isFitPaired,
      warrantyStatus,
      currentPair: {
        id: fitPairUserId,
        name: null,
        icon: null,
      },
      deviceBond: {
        id: null,
        name: null,
        date: null,
        icon: null,
      },
    };

    const action = getLocalStorageObject('actionAfterLogin');
    if (
      fitPairStatus == 3 &&
      isFitPaired &&
      fitPairUserId != this.userId &&
      action !== 'coverPair'
    ) {
      this.openFitPairAlert();
    }

    this.uiFlag.fitPairChanged = true;
  }

  /**
   * 將api資訊針對裝置頁面進行處理
   * @param resArr {Array<any>}-裝置頁面所需的api資訊
   * @author kidin-1100702
   */
  handleDeviceInfo(resArr: Array<any>) {
    const [deviceDetail, qrFitPair, fitPairInfo] = resArr;
    const { info: detailInfo } = deviceDetail,
      { info: qrInfo } = qrFitPair;
    const {
      deviceBondUserId,
      deviceBondUserName,
      deviceBondDate,
      fitPairStatus,
      fitPairType,
      deviceEnableDate,
      equipmentInfo: { equipmentSN, totalNumberOfEnable, totalUseMeter, totalUseTimeSecond },
    } = detailInfo;
    const { qrURL } = qrInfo;
    this.deviceInfo.qrURL = qrURL;
    this.deviceInfo.deviceEnableDate = deviceEnableDate;
    this.fitPairInfo = {
      status: fitPairStatus,
      type: fitPairType,
      isFitPaired: false,
      warrantyStatus: null,
      currentPair: {
        id: null,
        name: null,
        icon: null,
      },
      deviceBond: {
        id: deviceBondUserId,
        name: deviceBondUserName,
        date: deviceBondDate,
        icon: null,
      },
    };

    if (equipmentSN) {
      const odometer = {
        totalNumberOfEnable,
        totalUseMeter,
        totalUseTimeSecond,
      };

      Object.assign(this.deviceInfo, { odometer });
    }

    if (fitPairInfo && fitPairInfo.info.deviceInfo.length > 0) {
      this.fitPairInfo.isFitPaired = true;
      const { info: pairInfo } = fitPairInfo,
        { userId, userName, pairIcon } = pairInfo.deviceInfo[0];
      this.fitPairInfo.currentPair = {
        id: userId,
        name: userName,
        icon: pairIcon,
      };

      this.uiFlag.fitPairChanged = true;
    }
  }

  /**
   * 根據註冊、綁定與否、使用者權限顯示可以點選的子頁面
   * @author kidin-1100707
   */
  handleChildPageBtn() {
    const overMaintantner = this.systemAccessRight <= AccessRight.maintainer;
    const overMarketing = this.systemAccessRight <= AccessRight.marketing;
    if (this.fitPairInfo.deviceBond.id == this.userId || overMarketing) {
      if (this.deviceInfo['odometer']) {
        this.childPageList = this.childPageList.concat(['management', 'odometer', 'register']);
      } else {
        this.childPageList = this.childPageList.concat(['management', 'register']);
      }
    }

    if (overMaintantner) {
      this.childPageList = this.childPageList.concat(['log']);
    }
  }

  /**
   * 確認是否顯示fitPair提示框
   * @author kidin-1100709
   */
  checkFitPairSettingMsg() {
    if (this.qrcodeService.getFitPairSettingMsg()) {
      this.uiFlag.showFitPairSettingDialog = true;
      this.qrcodeService.setFitPairSettingMsg(false);
    }
  }

  /**
   * 編輯裝置資訊
   * @param fitPairStatus {number}-fitpair開放對象
   * @author kidin-1100702
   */
  editDeviceInfo(fitPairStatus: number) {
    const body = {
      deviceSettingJson: '',
      fitPairStatus,
      myEquipmentSN: this.deviceInfo.sn,
      token: this.auth.token,
    };

    this.api70xxService
      .fetchEditDeviceInfo(body)
      .pipe(
        switchMap((res) =>
          this.translateService.get('hellow world').pipe(
            map(() => res),
            takeUntil(this.ngUnsubscribe)
          )
        )
      )
      .subscribe((res) => {
        const translateOfEdit = this.translateService.instant('universal_operating_edit');
        if (res.resultCode !== 200) {
          const failMsg = `${translateOfEdit} ${this.translateService.instant(
            'universal_status_failure'
          )}`;
          this.snackbar.open(failMsg, 'OK', { duration: 3000 });
        } else {
          this.fitPairInfo.status = fitPairStatus;
          if (fitPairStatus !== 3) {
            this.fitPairInfo.currentPair = {
              icon: null,
              id: null,
              name: null,
            };

            this.uiFlag.fitPairChanged = true;
          }

          const successMsg = `${translateOfEdit} ${this.translateService.instant(
            'universal_status_success'
          )}`;
          this.snackbar.open(successMsg, 'OK', { duration: 3000 });
        }

        this.uiFlag.showFitPairSettingDialog = false;
      });
  }

  /**
   * 處理裝置綁定或解綁
   * @param bondStatus {1 | 2}-欲更新的綁定狀態
   * @author kidin-1100706
   */
  handleBonding(bondStatus: 1 | 2) {
    const token = this.auth.token;
    const { sn } = this.deviceInfo;
    if (!token) {
      this.handleGoLoginPage('bonding');
    } else {
      const body = {
        token,
        bondEquipmentSN: sn,
        bondStatus,
        targetUserId: bondStatus === 2 ? this.fitPairInfo.deviceBond.id : '',
      };

      this.api70xxService.fetchUpdateDeviceBonding(body).subscribe((res) => {
        const { resultCode, resultMessage } = res;
        if (resultCode !== 200) {
          const errorMsg = bondStatus === 2 ? resultMessage : errMsg;
          this.hintDialogService.openAlert(errorMsg);
        } else {
          if (bondStatus === 2) {
            this.snackbar.open('解綁成功', 'OK', { duration: 3000 });

            this.router.navigateByUrl('/dashboard/system/device-pair-management');
          } else {
            const navigatePath = `/dashboard/device/info/${sn}`;
            this.qrcodeService.setFitPairSettingMsg(true);
            this.router.navigateByUrl(navigatePath);
          }
        }
      });
    }
  }

  /**
   * 解綁時跳提示視窗
   * @author kidin-1100706
   */
  showUnBondingAlert() {
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'message',
        body: `${this.translateService.instant('universal_popUpMessage_continueExecution')} ${
          this.fitPairInfo.deviceBond.name
        } ${this.translateService.instant('universal_uiFitpair_unbind')} sn: ${
          this.deviceInfo.sn
        } ?`,
        confirmText: this.translateService.instant('universal_operating_confirm'),
        onConfirm: () => this.handleBonding(2),
        cancelText: 'cancel',
      },
    });
  }

  /**
   * 進行FitPair
   * @author kidin-1100702
   */
  handleFitPair(fitPairType: 1 | 2, coverFitPair = false) {
    const token = this.auth.token;
    const { sn, cs } = this.deviceInfo;
    if (!token) {
      if (coverFitPair) {
        this.handleGoLoginPage('coverPair');
      } else {
        this.handleGoLoginPage(fitPairType === 1 ? 'fitPair' : 'unFitPair');
      }
    } else {
      // call api 7012
      const fetchFitPairSetting = (token: string, sn: string, type: 1 | 2) => {
        const fitPairBody = {
          token,
          pairEquipmentSN: [sn],
          fitPairType: type,
        };

        return this.api70xxService.fetchFitPairSetting(fitPairBody);
      };

      // call api 7007
      const fetchUploadDeviceInfo = (token: string, sn: string, cs: string) => {
        const uploadDeviceInfoBody = {
          token,
          uploadEquipmentSN: sn,
          verifyCode: cs,
          deviceDistance: '',
          deviceFWVer: '',
          deviceRFVer: '',
        };

        return this.api70xxService.fetchUploadDeviceInfo(uploadDeviceInfoBody, sn);
      };

      fetchFitPairSetting(token, sn, fitPairType)
        .pipe(
          switchMap((res) => {
            const { apiCode, resultCode, resultMessage } = res;
            if (resultCode !== 200) {
              this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
              return res;
            } else {
              // 覆蓋先前的fitpair對象
              if (coverFitPair) {
                return fetchFitPairSetting(token, sn, 1).pipe(
                  switchMap((pairRes) => {
                    const { apiCode, resultCode, resultMessage } = pairRes;
                    if (resultCode !== 200) {
                      this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
                      return pairRes;
                    } else {
                      // 再次call api 7007確認doulble check fitpair
                      return fetchUploadDeviceInfo(token, sn, cs).pipe(map((resp) => resp));
                    }
                  })
                );
              } else {
                // 再次call api 7007確認doulble check fitpair
                return fetchUploadDeviceInfo(token, sn, cs).pipe(map((resp) => resp));
              }
            }
          })
        )
        .subscribe((response) => {
          const { apiCode, resultCode, resultMessage } = response as any;
          if (resultCode !== 200) {
            this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
          } else {
            this.translateService
              .get('hellow world')
              .pipe(takeUntil(this.ngUnsubscribe))
              .subscribe(() => {
                const operating =
                  fitPairType === 1 || coverFitPair
                    ? 'Fitpair'
                    : this.translateService.instant('universal_uiFitpair_undoFitpair');
                const resultMsg = `${operating} ${this.translateService.instant(
                  'universal_status_success'
                )}`;
                this.snackbar.open(resultMsg, 'OK', { duration: 3000 });
              });

            this.handleFitPairInfo(response);
          }
        });
    }
  }

  /**
   * 未登入則導至登入頁面
   * @author kidin-1100708
   */
  handleGoLoginPage(action: 'fitPair' | 'unFitPair' | 'coverPair' | 'bonding') {
    this.auth.backUrl = location.href;
    setLocalStorageObject('actionAfterLogin', action);
    this.router.navigateByUrl(`signIn-web`);
  }

  /**
   * 若使用者非該裝置榜定者，則跳出訊息提示是否複寫fitpair對象
   * @author kidin-1100709
   */
  openFitPairAlert() {
    this.translateService
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        return this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: this.translateService.instant('universal_deviceSetting_overwrite'),
            confirmText: this.translateService.instant('universal_operating_confirm'),
            onConfirm: this.handleFitPair.bind(this, 2, true),
            cancelText: this.translateService.instant('universal_operating_cancel'),
          },
        });
      });
  }

  /**
   * 根據註冊與否跳出提示框
   * @param type {1 | 2}-fitpair or not
   * @author kidin-1100709
   */
  checkBonding(type: 1 | 2) {
    const { warrantyStatus } = this.fitPairInfo;
    if (type == 2 || warrantyStatus == 2) {
      this.handleFitPair(type);
    } else {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: this.translateService.instant('universal_uiFitpair_singleFitpairPrecautions'),
          confirmText: this.translateService.instant('universal_deviceSetting_productRegistration'),
          onConfirm: this.handleBonding.bind(this, 1),
          cancelText: this.translateService.instant('universal_uiFitpair_singleFitpair'),
          onCancel: this.handleFitPair.bind(this, 1),
        },
      });
    }
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
   * 處理app 下載連結的收合
   * @param appId {string}-app id
   * @author kidin-1100707
   */
  handleFoldDl(appId: string) {
    if (this.uiFlag.openAppDl.includes(appId)) {
      this.uiFlag.openAppDl = this.uiFlag.openAppDl.filter((_appId) => _appId !== appId);
    } else {
      this.uiFlag.openAppDl.push(appId);
    }
  }

  /**
   * 確認登入後是否有任何步驟要接著進行
   * @author kidin-1100709
   */
  checkActionAfterLogin() {
    const action = getLocalStorageObject('actionAfterLogin');
    switch (action) {
      case 'fitPair':
        this.handleFitPair(1);
        break;
      case 'unFitPair':
        this.handleFitPair(2);
        break;
      case 'coverPair':
        this.handleFitPair(2, true);
        break;
      case 'bonding':
        this.handleBonding(1);
        break;
    }

    removeLocalStorageObject('actionAfterLogin');
  }

  /**
   * 取得設備日誌
   * @author kidin-1100712
   */
  getProductLog() {
    const token = this.auth.token;
    const { sn } = this.deviceInfo;
    const { filterStartTime, filterEndTime } = this.logDate;
    const body = {
      token,
      queryEquipmentSN: sn,
      filterStartTime,
      filterEndTime,
      page: this.pageSetting.pageIndex,
      pageCounts: this.pageSetting.onePageSize,
    };

    this.api70xxService.fetchGetEquipmentLog(body).subscribe((res) => {
      const { apiCode, resultCode, resultMessage, info } = res;
      if (resultCode !== 200) {
        this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
      } else {
        const { totalCounts, equipmentErrorLog } = info,
          { pageIndex, onePageSize } = this.pageSetting;
        this.pageSetting = {
          totalCounts,
          pageIndex,
          onePageSize,
        };
        this.equipmentLog = equipmentErrorLog;
      }
    });
  }

  /**
   * 切換分頁
   * @param pageSetting {PaginationSetting}-變更後的分頁設定
   * @author kidin-1100712
   */
  changePage(pageSetting: PaginationSetting) {
    if (this.equipmentLog.length > 0) {
      const { pageIndex, onePageSize } = pageSetting;
      this.pageSetting.pageIndex = pageIndex;
      this.pageSetting.onePageSize = onePageSize;
      this.getProductLog();
    }
  }

  /**
   * 取得使用者選擇的日期
   * @param $event {MatDatepickerInputEvent<Dayjs>}
   * @param isStartTime {boolean}
   * @author kidin-1100712
   */
  handleDateChange($event: MatDatepickerInputEvent<Dayjs>, isStartTime: boolean) {
    if (isStartTime) {
      this.logDate.filterStartTime = dayjs($event.value).format('YYYY-MM-DDT00:00:00.000Z');
    } else {
      this.logDate.filterEndTime = dayjs($event.value).format('YYYY-MM-DDT23:59:59.000Z');
    }
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}

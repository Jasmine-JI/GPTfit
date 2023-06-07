import { Component, OnInit, OnChanges, OnDestroy, Input } from '@angular/core';
import { Router } from '@angular/router';
import { QrcodeService } from '../../../../core/services/qrcode.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Api10xxService,
  AuthService,
  ApiCommonService,
  Api70xxService,
} from '../../../../core/services';
import { PaginationSetting } from '../../../../core/models/compo/pagination.model';
import { Subject, fromEvent, Subscription, combineLatest } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { appPath } from '../../../../app-path.const';
import { Domain, WebIp, QueryString } from '../../../../core/enums/common';
import { TimeFormatPipe } from '../../../../core/pipes/time-format.pipe';
import { ProductTypePipe } from '../../../../core/pipes/product-type.pipe';
import { QRCodeModule } from 'angularx-qrcode';
import { PaginationComponent } from '../../../../components/pagination/pagination.component';
import { NgIf, NgFor } from '@angular/common';
import { LoadingBarComponent } from '../../../../components/loading-bar/loading-bar.component';

@Component({
  selector: 'app-my-device',
  templateUrl: './my-device.component.html',
  styleUrls: ['./my-device.component.scss'],
  standalone: true,
  imports: [
    LoadingBarComponent,
    NgIf,
    PaginationComponent,
    NgFor,
    QRCodeModule,
    TranslateModule,
    ProductTypePipe,
    TimeFormatPipe,
  ],
})
export class MyDeviceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() targetUserId: number;
  private ngUnsubscribe = new Subject();
  clickEvent: Subscription;

  /**
   * ui會用到的各種flag
   */
  uiFlag = {
    openMenu: null,
    showMoreInfo: [],
    progress: 0,
  };

  /**
   * 頁碼設定
   */
  pageSetting: PaginationSetting = {
    totalCounts: 0,
    pageIndex: 0,
    onePageSize: 10,
  };

  token = this.authService.token;
  deviceList: Array<any>;
  readonly onePageSizeOpt = [5, 10, 20];
  readonly imgStoragePath = `http://${
    location.hostname.includes(WebIp.develop) ? Domain.uat : location.hostname
  }/app/public_html/products`;

  constructor(
    private router: Router,
    private qrcodeService: QrcodeService,
    public dialog: MatDialog,
    private translateService: TranslateService,
    private snackbar: MatSnackBar,
    private api10xxService: Api10xxService,
    private authService: AuthService,
    private apiCommonService: ApiCommonService,
    private api70xxService: Api70xxService
  ) {}

  ngOnInit() {
    if (!this.targetUserId && !location.pathname.includes(appPath.adminManage.home)) {
      this.getDeviceList();
    }
  }

  ngOnChanges() {
    if (this.targetUserId) {
      this.getDeviceList(this.targetUserId);
    }
  }

  /**
   * 取得裝置列表
   * @param targetUserId {number}-查詢對象
   * @author kidin-1100715
   */
  getDeviceList(targetUserId: number = null) {
    const { pageIndex, onePageSize } = this.pageSetting,
      body = {
        token: this.token,
        page: pageIndex,
        pageCounts: onePageSize,
      };

    this.uiFlag.progress = 20;
    if (targetUserId) Object.assign(body, { targetUserId });
    this.api70xxService.fetchGetDeviceList(body).subscribe((res) => {
      this.uiFlag.progress = 40;
      const { apiCode, resultCode, resultMessage, info } = res;
      if (resultCode !== 200) {
        this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
        this.uiFlag.progress = 100;
      } else {
        const { totalCounts, deviceList } = info,
          { pageIndex, onePageSize } = this.pageSetting;
        this.deviceList = deviceList;
        this.pageSetting = { totalCounts, pageIndex, onePageSize };
        if (this.deviceList.length > 0) {
          this.getOtherInfo();
        } else {
          this.uiFlag.progress = 100;
        }
      }
    });
  }

  /**
   * 取得裝置圖片、fitpair對象暱稱
   * @author kidin-1100715
   */
  getOtherInfo() {
    const idSet = new Set(),
      snList = [];
    this.deviceList.forEach((_list) => {
      const { fitPairStatus, fitPairUserId, lastFitPairUserId, myEquipmentSN } = _list;

      // 僅開放裝置fitpair才需顯示fitpair對象
      snList.push(myEquipmentSN);
      if (fitPairStatus == 3) {
        if (fitPairUserId) {
          idSet.add(fitPairUserId);
        } else if (lastFitPairUserId) {
          idSet.add(lastFitPairUserId);
        }
      }
    });

    const productInfoBody = {
      token: this.token,
      queryType: 1,
      queryArray: snList,
    };
    const querry = [this.api70xxService.fetchGetProductInfo(productInfoBody)];
    if (idSet.size > 0) {
      const idList = Array.from(idSet),
        body = {
          token: this.token,
          targetUserId: idList,
        };
      querry.push(this.api10xxService.fetchGetUserProfile(body));
    }

    this.uiFlag.progress = 70;
    combineLatest(querry).subscribe((res) => {
      const [productInfoRes, userProfileRes] = res,
        { apiCode, resultCode, resultMessage, info } = productInfoRes;
      if (resultCode !== 200) {
        console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
      } else {
        this.deviceList = this.deviceList.map((_list, _idx) => {
          // 顯示fitpair qrcode
          const checkSum = this.qrcodeService.createDeviceChecksum(_list.myEquipmentSN);
          const { deviceSN, btName, CS } = QueryString;
          const qrURL = `${location.origin}/${appPath.device.pair}?${deviceSN}=${_list.myEquipmentSN}&${btName}=${_list.myEquipmentSN}&${CS}=${checkSum}`;
          Object.assign(_list, { qrURL });
          // 取得裝置圖片
          const { equipmentSN, modelImg } = info.productInfo[_idx];
          if (_list.myEquipmentSN === equipmentSN) {
            Object.assign(_list, { modelImg });
          }

          const { fitPairStatus, fitPairUserId, lastFitPairUserId } = _list;
          if (userProfileRes && fitPairStatus == 3) {
            // 取得使用者暱稱
            const { processResult, userProfile } = userProfileRes;
            if (processResult && processResult.resultCode === 200) {
              const havecurrentFitpair = fitPairUserId && fitPairUserId.length > 0,
                haveLastFitpair = lastFitPairUserId && lastFitPairUserId.length > 0;
              userProfile.forEach((_user) => {
                const { userId, nickname } = _user;
                if (havecurrentFitpair && userId == fitPairUserId) {
                  Object.assign(_list, { fitPairUserName: nickname });
                } else if (haveLastFitpair && userId == lastFitPairUserId) {
                  Object.assign(_list, { lastFitPairUserName: nickname });
                }
              });
            }
          }

          return _list;
        });
      }
    });

    this.uiFlag.progress = 100;
  }

  /**
   * 切換分頁
   * @param pageSetting {PaginationSetting}-變更後的分頁設定
   * @author kidin-1100712
   */
  changePage(pageSetting: PaginationSetting) {
    if (this.deviceList && this.deviceList.length > 0) {
      this.uiFlag.progress = 0;
      const { pageIndex, onePageSize } = pageSetting;
      this.pageSetting.pageIndex = pageIndex;
      this.pageSetting.onePageSize = onePageSize;
      this.getDeviceList(this.targetUserId ?? null);
    }
  }

  /**
   * 編輯fitpair開放對象
   * @param e {MouseEvent}
   * @param obj {number}-fitpair開放對象
   * @author kidin-1100715
   */
  changeFitObj(e: MouseEvent, fitPairStatus: number) {
    e.stopPropagation();
    const body = {
      deviceSettingJson: '',
      fitPairStatus,
      myEquipmentSN: this.deviceList[this.uiFlag.openMenu].myEquipmentSN,
      token: this.token,
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
          this.closeDropMenu();
          const failMsg = `${translateOfEdit} ${this.translateService.instant(
            'universal_status_failure'
          )}`;
          this.snackbar.open(failMsg, 'OK', { duration: 3000 });
        } else {
          this.deviceList[this.uiFlag.openMenu].fitPairStatus = fitPairStatus;
          if (fitPairStatus !== 3) {
            this.deviceList[this.uiFlag.openMenu].fitPairUserId = null;
          }

          this.closeDropMenu();
          const successMsg = `${translateOfEdit} ${this.translateService.instant(
            'universal_status_success'
          )}`;
          this.snackbar.open(successMsg, 'OK', { duration: 3000 });
        }
      });
  }

  /**
   * 顯示選單與否
   * @param e {MouseEvent}
   * @param idx {number}-該項目索引
   * @author kidin-1100715
   */
  openMenu(e: MouseEvent, idx: number) {
    e.stopPropagation();
    if (this.uiFlag.openMenu === idx) {
      this.closeDropMenu();
    } else {
      this.uiFlag.openMenu = idx;
      this.handleGlobalClick();
    }
  }

  /**
   * 顯示更多資訊與否
   * @param e {MouseEvent}
   * @param idx {number}-該項目索引
   * @author kidin-1100715
   */
  getMoreInfo(e: MouseEvent, idx: number) {
    e.stopPropagation();
    this.closeDropMenu();
    if (this.uiFlag.showMoreInfo.includes(idx)) {
      this.uiFlag.showMoreInfo = this.uiFlag.showMoreInfo.filter((_idx) => _idx !== idx);
    } else {
      this.uiFlag.showMoreInfo.push(idx);
    }
  }

  /**
   * 將頁面轉導至裝置詳細頁面
   * @param sn {string}-裝置sn碼
   * @author kidin-1100715
   */
  goDetail(sn: string) {
    const { pathname } = location;
    const { dashboard, adminManage, device } = appPath;
    const isAdminPage = pathname.includes(adminManage.home);
    const insertPathName = isAdminPage ? `/${adminManage.home}` : '';
    const url = `/${dashboard.home}${insertPathName}/${device.home}/${device.info}/${sn}`;
    this.router.navigateByUrl(url);
  }

  /**
   * 偵測全域點擊事件，以收納"更多"選單
   * @author kidin-20201112
   */
  handleGlobalClick() {
    const clickEvent = fromEvent(document, 'click');
    this.clickEvent = clickEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.closeDropMenu();
    });
  }

  /**
   * 關閉下拉式選單
   * @author kidin-1100716
   */
  closeDropMenu() {
    this.uiFlag.openMenu = null;
    if (this.clickEvent) this.clickEvent.unsubscribe();
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

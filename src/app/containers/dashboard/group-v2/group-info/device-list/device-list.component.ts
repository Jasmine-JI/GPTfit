import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GroupDetailInfo, UserSimpleInfo } from '../../../models/group-detail';
import { GroupIdSlicePipe } from '../../../../../shared/pipes/group-id-slice.pipe';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { Router } from '@angular/router';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { PaginationSetting } from '../../../../../shared/models/pagination';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { ReportConditionOpt } from '../../../../../shared/models/report-condition';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss']
})
export class DeviceListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
   uiFlag = {
    progress: 0
  };

  /**
   * 頁碼設定
   */
   pageSetting: PaginationSetting = {
    totalCounts: 0,
    pageIndex: 0,
    onePageSize: 10
  };

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    pageType: 'deviceList',
    group: {
      brands: null,
      branches: null,
      coaches: [],
      selectGroup: null
    },
    sn: null,
    hideConfirmBtn: true
  }

  /**
   * 目前群組的詳細資訊
   */
   groupInfo = <GroupDetailInfo>{};

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  token = this.utils.getToken() || '';
  deviceList: Array<any>;
  readonly onePageSizeOpt = [5, 10, 20];
  readonly imgStoragePath = 
    `http://${location.hostname.includes('192.168.1.235') ? 'app.alatech.com.tw' : location.hostname}/app/public_html/products`;

  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private hashIdService: HashIdService,
    private groupIdSlicePipe: GroupIdSlicePipe,
    private dialog: MatDialog,
    private translateService: TranslateService,
    private snackBar: MatSnackBar,
    private qrcodeService: QrcodeService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    this.initPage();
  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   * @author kidin-1091020
   */
  initPage() {
    combineLatest([
      this.groupService.getRxGroupDetail(),
      this.groupService.getRxCommerceInfo(),
      this.groupService.getAllLevelGroupData(),
      this.groupService.getUserSimpleInfo()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      Object.assign(resArr[0], {groupLevel: this.utils.displayGroupLevel(resArr[0].groupId)});
      Object.assign(resArr[0], {expired: resArr[1].expired});
      Object.assign(resArr[0], {commerceStatus: resArr[1].commerceStatus});
      this.groupInfo = resArr[0];
      this.userSimpleInfo = resArr[3];
    })

  }

  /**
   * 取得裝置列表
   * @param targetGrouId {number}-查詢對象群組
   * @author kidin-1100715
   */
   getDeviceList(targetGrouId: number = null) {
    const { pageIndex, onePageSize } = this.pageSetting,
          body = {
            token: this.token,
            page: pageIndex,
            pageCounts: onePageSize
          };

    this.uiFlag.progress = 20;
    this.qrcodeService.getDeviceList(body).subscribe(res => {
      this.uiFlag.progress = 40;
      const { apiCode, resultCode, resultMessage, info } = res;
      if (resultCode !== 200) {
        this.utils.handleError(resultCode, apiCode, resultMessage);
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
    this.deviceList.forEach(_list => {
      const {
        fitPairStatus,
        fitPairUserId,
        lastFitPairUserId,
        myEquipmentSN
      } = _list;

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
      queryArray: snList
    };
    let querry = [this.qrcodeService.getProductInfo(productInfoBody)];
    if (idSet.size > 0) {
      const idList = Array.from(idSet),
      body = {
        token: this.token,
        targetUserId: idList
      };
      querry.push(this.userProfileService.getUserProfile(body));
    }

    this.uiFlag.progress = 70;
    combineLatest(querry).subscribe(res => {
      const [productInfoRes, userProfileRes] = res,
            { apiCode, resultCode, resultMessage, info } = productInfoRes;
      if (resultCode !== 200) {
        console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
      } else {
        this.deviceList = this.deviceList.map((_list, _idx) => {
          // 顯示fitpair qrcode
          const checkSum = this.qrcodeService.createDeviceChecksum(_list.myEquipmentSN),
                qrURL = `${
                  location.origin}/pair?device_sn=${
                  _list.myEquipmentSN}&bt_name=${
                  _list.myEquipmentSN}&cs=${checkSum
                }`;
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
              const havecurrentFitpair = fitPairUserId.length > 0,
                    haveLastFitpair = lastFitPairUserId.length > 0;
              userProfile.forEach(_user => {
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
      this.getDeviceList();
    }

  }

  /**
   * 將頁面轉導至裝置詳細頁面
   * @param sn {string}-裝置sn碼
   * @author kidin-1100715
   */
   goDetail(sn: string) {
    const { pathname } = location;
    if (pathname.includes('system')) {
      this.router.navigateByUrl(`/dashboard/system/device/info/${sn}`);
    } else {
      this.router.navigateByUrl(`/dashboard/device/info/${sn}`);
    }

  }


  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

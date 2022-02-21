import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest, fromEvent, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GroupDetailInfo, UserSimpleInfo } from '../../../models/group-detail';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { GroupService } from '../../../../../shared/services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { ReportConditionOpt } from '../../../../../shared/models/report-condition';
import { ReportService } from '../../../../../shared/services/report.service';
import { GroupLevel } from '../../../../dashboard/models/group-detail';

type EditMode = 'add' | 'del';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss']
})
export class DeviceListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  resizeEvent = new Subscription();
  dragEvent = new Subscription();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    progress: 0,
    editMode: <EditMode>null,
    isPhoneMode: false,
    selectAll: null
  };

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    brandType: 1,
    pageType: 'deviceList',
    group: {
      brands: null,
      branches: null,
      coaches: [],
      selectGroup: null
    },
    deviceType: ['1', '2', '3', '4', '5'],
    deviceUseStatus: 'all',
    hideConfirmBtn: false
  }

  /**
   * 目前群組的詳細資訊
   */
   groupInfo = <GroupDetailInfo>{};

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  token = this.utils.getToken();
  deviceList: Array<any>;  // 目前顯示的清單
  groupDeviceList: Array<any>;  // 群組裝置清單
  myDeviceList: Array<any>;  // 個人裝置清單
  filterSn: string = null;
  updateList: Array<string>;
  dragDebounce: any;
  beforeSelectGroup: string;
  mouseHoldTime = 0;
  readonly onePageSizeOpt = [5, 10, 20];
  readonly imgStoragePath = 
    `http://${location.hostname.includes('192.168.1.235') ? 'app.alatech.com.tw' : location.hostname}/app/public_html/products`;

  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private dialog: MatDialog,
    private translateService: TranslateService,
    private snackbar: MatSnackBar,
    private qrcodeService: QrcodeService,
    private userProfileService: UserProfileService,
    private reportService: ReportService
  ) { }

  ngOnInit(): void {
    this.checkWindowSize(window.innerWidth);
    this.subscribeWindowSize();
    this.getNeedInfo();
  }

  /**
   * 確認視窗大小是否為手機
   * @param innerWidth {number}-視窗大小
   * @author kidin-1100723
   */
  checkWindowSize(innerWidth: number) {
    this.uiFlag.isPhoneMode = innerWidth <= 767;
  }

  /**
   * 訂閱視窗寬度
   * @author kidin-1100316
   */
   subscribeWindowSize() {
    const resize = fromEvent(window, 'resize');
    this.resizeEvent = resize.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      const windowWidth = (e as any).target.innerWidth
      this.checkWindowSize(windowWidth);
    });

  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   * @author kidin-1091020
   */
  getNeedInfo() {
    combineLatest([
      this.groupService.getUserSimpleInfo(),
      this.groupService.getAllLevelGroupData(),
      this.groupService.getRxGroupDetail()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      const [userSimpleInfo, allLevelGroupData, groupDetail] = resArr,
            { groupId, brands, branches } = allLevelGroupData as any,
            groupLevel = this.utils.displayGroupLevel(groupId),
            group = this.reportConditionOpt.group;
      Object.assign(groupDetail, { groupLevel });
      this.userSimpleInfo = userSimpleInfo;
      this.groupInfo = groupDetail;
      this.reportConditionOpt.brandType = groupDetail.brandType;
      if (groupLevel === GroupLevel.brand) {
        group.brands = brands[0];
        group.branches = branches;
        group.selectGroup = groupId.split('-').slice(0, 3).join('-');
      }

      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getSelectedCondition();
    })

  }

  /**
   * 根據回傳的篩選設定取裝置列表
   * @author kidin-1100722
   */
  getSelectedCondition() {
    this.reportService.getReportCondition().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.reportConditionOpt = this.utils.deepCopy(res);
      const { selectGroup } = this.reportConditionOpt.group;
      let targetGroupId: string;
      if (selectGroup) {
        targetGroupId = this.groupService.getCompleteGroupId(selectGroup.split('-'));
      } else {
        const { groupId } = this.groupInfo;
        targetGroupId = `${this.groupService.getPartGroupId(groupId, 4)}-0-0`;
      }

      if (!this.uiFlag.editMode) this.getDeviceList(targetGroupId);
    });

  }

  /**
   * 取得裝置列表
   * @param targetGroupId {string}-查詢對象群組
   * @author kidin-1100715
   */
  getDeviceList(targetGroupId: string = null) {
    const body = {
            token: this.token,
            page: 0,
            pageCounts: 100000
          };

    if (targetGroupId) {
      Object.assign(body, { targetGroupId });
    }

    this.uiFlag.progress = 20;
    this.qrcodeService.getDeviceList(body).subscribe(res => {
      this.uiFlag.progress = 40;
      const { apiCode, resultCode, resultMessage, info } = res;
      if (resultCode !== 200) {
        this.utils.handleError(resultCode, apiCode, resultMessage);
        this.uiFlag.progress = 100;
      } else {
        let { deviceList } = info;
        if (deviceList.length > 0) {
          // 過濾掉非該群組的裝置
          if (!this.uiFlag.editMode) {
            const { selectGroup } = this.reportConditionOpt.group;
            let targetGroup: string;
            if (!selectGroup) {
              targetGroup = this.groupService.getPartGroupId(targetGroupId, 4);
            } else {
              targetGroup = selectGroup;
            }

            deviceList = deviceList.filter(_list => {
              const { groupId } = _list;
              let isGroupDevice = false;
              groupId.forEach(_id => {
                if (_id.includes(targetGroup)) isGroupDevice = true;
              });

              return isGroupDevice;
            });
          } 
            
          this.getOtherInfo(deviceList);
        } else {
          this.deviceList = [];
          this.uiFlag.progress = 100;
        }

      }

    });

  }

  /**
   * 取得裝置圖片、fitpair對象暱稱
   * @param deviceList {any}-裝置列表
   * @author kidin-1100715
   */
  getOtherInfo(deviceList: any) {
    const idSet = new Set(),
          snList = [];

    // 列出fitpair和bonding的userId清單，以方便call api
    deviceList.forEach(_list => {
      const {
        fitPairUserId,
        lastFitPairUserId,
        bondingUserId,
        myEquipmentSN
      } = _list;

      snList.push(myEquipmentSN);
      if (fitPairUserId) {
        idSet.add(fitPairUserId);
      } else if (lastFitPairUserId) {
        idSet.add(lastFitPairUserId);
      }

      if (bondingUserId) {
        idSet.add(bondingUserId);
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
        let finalList = deviceList.map((_list, _idx) => {
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

          const { fitPairUserId, lastFitPairUserId, bondingUserId } = _list;
          if (userProfileRes) {
            // 取得使用者暱稱
            const { processResult, userProfile } = userProfileRes;
            if (processResult && processResult.resultCode === 200) {
              const havecurrentFitpair = fitPairUserId && fitPairUserId.length > 0,
                    haveLastFitpair = lastFitPairUserId && lastFitPairUserId.length > 0;
              userProfile.forEach(_user => {
                const { userId, nickname } = _user;
                if (havecurrentFitpair && userId == fitPairUserId) {
                  Object.assign(_list, { fitPairUserName: nickname });
                } else if (haveLastFitpair && userId == lastFitPairUserId) {
                  Object.assign(_list, { lastFitPairUserName: nickname });
                }

                if (bondingUserId == userId) {
                  Object.assign(_list, { bondingUserName: nickname });
                }
                
              });
              
            }

          }

          // 供刪除紀錄選取用變數
          Object.assign(_list, { delSelected: false });

          // 如果為個人裝置列表，再比對哪些裝置已加入群組
          if (this.uiFlag.editMode === 'add' && this.deviceList) {
            let added = false;
            this.deviceList.forEach(_deviceList => {
              if (_list.myEquipmentSN === _deviceList.myEquipmentSN) added = true;
            });

            Object.assign(_list, { added });
            Object.assign(_list, { addSelected: added });
          }

          return _list;
        });

        if (this.uiFlag.editMode === 'add') {
          this.myDeviceList = finalList;
        } else {
          this.groupDeviceList = finalList;
        }

        this.deviceList = finalList;
      }

    });

    this.uiFlag.progress = 100;
  }

  /**
   * 處理使用者輸入裝置sn碼，並根據sn碼篩選裝置
   * @param e {KeyboardEvent | Event}
   * @author kidin-1100722
   */
  handleSnInput(e: KeyboardEvent | Event) {
    const value = (e as any).currentTarget.value.trim();
    this.filterSn = value.length > 0 ? value : null;
  }

  /**
   * 清空sn輸入欄位，並取消篩選
   * @author kidin-1100722
   */
  cancelSnFilter() {
    this.filterSn = null;
  }

  /**
   * 更新裝置列表
   * @author kidin-1100722
   */
  refreshList() {
    const { selectGroup } = this.reportConditionOpt.group;
      let targetGroupId: string;
      if (selectGroup) {
        targetGroupId = this.groupService.getCompleteGroupId(selectGroup.split('-'));
      } else {
        const { groupId } = this.groupInfo;
        targetGroupId = groupId;
      }

      this.getDeviceList(targetGroupId);
  }

  /**
   * 根據是否為註冊人員轉導至裝置詳細頁面
   * @param idx {number}-裝置順位
   * @author kidin-1100723
   */
  navigateDevicePage(idx: number) {
    if (!this.uiFlag.editMode) {
      const { myEquipmentSN, bondingUserId, qrURL } = this.deviceList[idx],
            { userId } = this.userSimpleInfo;
      if (bondingUserId != userId) {
        window.open(qrURL);
      } else {
        window.open(`${location.origin}/dashboard/device/info/${myEquipmentSN}`);
      }

    } else {
      const { editMode } = this.uiFlag,
            { added } = this.deviceList[idx];
      if (!added) this.selectOne(null, editMode, idx);
    }

  }

  /**
   * 變更刪除/增加的按鈕位置
   * @param e {MouseEvent | ToachEvent}
   * @param trigger {'mouse' | 'touch'}-觸發的類型
   * @author kidin-1100726
   */
  changeBtnPositionStart(e: any, trigger: 'mouse' | 'touch') {
    this.subscribeMouseUpEvent(trigger);
    // 產生時間緩衝避免純點擊和拖曳容易互相影響
    this.mouseHoldTime = 0;
    this.dragDebounce = setInterval(() => {
      this.mouseHoldTime += 100;
      if (this.mouseHoldTime > 200) {
        clearInterval(this.dragDebounce);
        const useMouse = trigger === 'mouse',
              mouseMoveEvent = fromEvent(window, useMouse ? 'mousemove' : 'touchmove');
        this.dragEvent = mouseMoveEvent.pipe(
          takeUntil(this.ngUnsubscribe)
        ).subscribe(event => {
          const btnGroup = document.getElementById('edit__btn__group');
          if (btnGroup) {
            const { clientX, clientY } = useMouse ? event as any : (event as any).touches[0],
                  
                  { innerHeight, innerWidth } = window,
                  btnGroupHalfHeight = 110 / 2,
                  btnHalfWdith = 100 / 2,
                  navHeight = 60,
                  btnGroupX = clientX - btnHalfWdith,
                  btnGroupY = clientY - btnGroupHalfHeight;
            let top: number,
                left: number;
            if (btnGroupX < 0) {
              left = 0;
            } else if (clientX + btnHalfWdith > innerWidth) {
              left = innerWidth - 2 * btnHalfWdith;
            } else {
              left = btnGroupX;
            }

            if (btnGroupY < navHeight) {
              top = navHeight;
            } else if (clientY + btnGroupHalfHeight > innerHeight) {
              top = innerHeight - 2 * btnGroupHalfHeight;
            } else {
              top = btnGroupY;
            }

            btnGroup.style.top = `${top}px`;
            btnGroup.style.left = `${left}px`;
          }

        });

      }

    }, 100);

  }

  /**
   * 停止拖曳
   * @param trigger {'mouse' | 'touch'}-觸發的類型
   * @author kidin-1100726
   */
  subscribeMouseUpEvent(trigger: 'mouse' | 'touch') {
    const useMouse = trigger === 'mouse',
          mouseUpEvent = fromEvent(window, useMouse ? 'mouseup' : 'touchend');
    const dragStop = mouseUpEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(event => {
      this.dragEvent.unsubscribe();
      dragStop.unsubscribe();
      if (this.dragDebounce) clearInterval(this.dragDebounce);
    });
 
  }

  /**
   * 開啟編輯模式
   * @param mode {EditMode}-增加或刪除模式
   * @author kidin-1100726
   */
  openEditMode(mode: EditMode) {
    if (mode === 'add') {
      this.getDeviceList();
    }

    this.uiFlag.selectAll = null;
    // 隱藏部份篩選器條件
    this.uiFlag.editMode = mode;
    delete this.reportConditionOpt.deviceUseStatus;
    this.reportConditionOpt.hideConfirmBtn = true;
    this.reportService.setReportCondition(this.reportConditionOpt);
  }

  /**
   * 選取或取消單一裝置
   * @param e {MouseEvent}
   * @param type {'add' | 'del'}-清單類別
   * @param idx {number}-指定的序列
   * @author kidin-1100727
   */
  selectOne(e: any, type: 'add' | 'del', idx: number) {
    if (e) e.stopPropagation();
    const key = type === 'add' ? 'addSelected' : 'delSelected';
    if (this.deviceList[idx][key]) {
      this.deviceList[idx][key] = false;
      this.uiFlag.selectAll = null;
    } else {
      this.deviceList[idx][key] = true;
    }

  }

  /**
   * 選擇或取消全部
   * @param type {'add' | 'del'}-清單類別
   * @author kidin-1100727
   */
  selectAll(type: 'add' | 'del') {
    const { selectAll } = this.uiFlag;
    this.deviceList = this.deviceList.map(_list => {
      if (type === 'add') {
        const { added } = _list;
        _list.addSelected = !(selectAll === 'add' && !added);
      } else {
        _list.delSelected = selectAll !== 'del';
      }

      return _list;
    });

    this.uiFlag.selectAll = selectAll === type ? null : type;
  }

  /**
   * 顯示加入裝置提醒
   * @author kidin-1100727
   */
  showAddAlert() {
    const equipmentSN = [];
    this.deviceList.forEach(_list => {
      const { myEquipmentSN, added, addSelected } = _list;
      if (!added && addSelected) equipmentSN.push(myEquipmentSN);
    });

    if (equipmentSN.length > 0) {
      this.translateService.get('hellow world').pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(() => {
        const msg = this.translateService.instant('universal_system_openFitpair');
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: msg,
            confirmText: this.translateService.instant('universal_operating_confirm'),
            onConfirm: () => this.addDevice(equipmentSN),
            cancelText: 'cancel'
          }

        });

      });

    } else {
      this.returnNormalMode();
    }

  }

  /**
   * 新增裝置
   * @param equipmentSN {Array<string>}-欲綁定群組的sn碼清單
   * @author kidin-1100727
   */
  addDevice(equipmentSN: Array<string>) {
    const body = {
      token: this.token,
      targetGroupId: this.groupInfo.groupId,
      equipmentSN,
      action: 1
    }

    this.qrcodeService.updateGroupDeviceList(body).subscribe(res => {
      const { resultCode, apiCode, resultMessage } = res;
      if (resultCode !== 200) {
        
        if (resultMessage === 'Execute access right is not enough.') {
          this.translateService.get('hellow world').pipe(
            takeUntil(this.ngUnsubscribe)
          ).subscribe(() => {
            const msg = this.translateService.instant('universal_group_notGroupMember');
            this.utils.openAlert(msg);
          });
          
        } else {
          this.utils.handleError(resultCode, apiCode, resultMessage);
        }

      } else {
        this.returnNormalMode();
      }

    });

  }

  /**
   * 刪除裝置
   * @author kidin-1100727
   */
  delDevice() {
    const equipmentSN = [];
    this.deviceList.forEach(_list => {
      const { myEquipmentSN, delSelected } = _list;
      if (delSelected) equipmentSN.push(myEquipmentSN);
    });

    if (equipmentSN.length > 0) {
      const body = {
        token: this.token,
        targetGroupId: this.groupInfo.groupId,
        equipmentSN,
        action: 2
      }

      this.qrcodeService.updateGroupDeviceList(body).subscribe(res => {
        const { resultCode, apiCode, resultMessage } = res;
        if (resultCode !== 200) {
          this.utils.handleError(resultCode, apiCode, resultMessage);
        } else {
          this.deviceList = this.deviceList.filter(_list => {
            return !_list.delSelected;
          });

          this.returnNormalMode();
        }

      });

    } else {
      this.returnNormalMode();
    }

  }

  /**
   * 變更回非編輯模式
   * @author kidin-1100727
   */
  returnNormalMode() {
    this.uiFlag.editMode = null;
    this.reportConditionOpt.deviceUseStatus = 'all';
    this.reportConditionOpt.hideConfirmBtn = false;
    this.reportService.setReportCondition(this.reportConditionOpt);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PrivacyObj, PrivacyEditObj } from '../../../../core/enums/api';
import { allPrivacyItem } from '../../../../core/models/const';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { SelectDate } from '../../../../shared/models/utils-type';
import { UserService, AuthService, Api21xxService } from '../../../../core/services';
import { checkResponse, deepCopy } from '../../../../core/utils/index';

enum RangeType {
  date = 1,
  all = 99,
}

@Component({
  selector: 'app-setting-privacy',
  templateUrl: './setting-privacy.component.html',
  styleUrls: ['./setting-privacy.component.scss', '../personal-child-page.scss'],
})
export class SettingPrivacyComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Output() patchEditPrivacy: EventEmitter<any> = new EventEmitter();

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    progress: 100,
    expand: false,
    showEditDialog: <PrivacyEditObj>null,
    batchEdit: false,
  };

  /**
   * 使用者設定
   */
  setting = {
    activityTracking: [PrivacyObj.self],
    activityTrackingReport: [PrivacyObj.self],
    lifeTrackingReport: [PrivacyObj.self],
  };

  dateRange = RangeType.all;
  selectDate = {
    startDate: '',
    endDate: '',
  };

  openObj = [PrivacyObj.self];
  userInfo: any;
  readonly PrivacyObj = PrivacyObj;
  readonly PrivacyEditObj = PrivacyEditObj;
  readonly RangeType = RangeType;

  constructor(
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private userService: UserService,
    private api21xxService: Api21xxService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getRxUserProfile();
  }

  /**
   * 從rxjs取得userProfile
   * @author kidin-1100830
   */
  getRxUserProfile() {
    const checkPrivacy = (privacy: Array<string>) => {
      const transformPrivach = privacy.map((_privacy) => +_privacy);
      if (transformPrivach.includes(PrivacyObj.anyone)) {
        return [...allPrivacyItem];
      } else {
        return transformPrivach;
      }
    };

    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.userInfo = res;
        const { privacy } = res;
        this.setting = {
          activityTracking: checkPrivacy(privacy.activityTracking),
          activityTrackingReport: checkPrivacy(privacy.activityTrackingReport),
          lifeTrackingReport: checkPrivacy(privacy.lifeTrackingReport),
        };
      });
  }

  /**
   * 儲存隱私權設定
   * @author kidin-1100831
   */
  saveSetting() {
    if (this.uiFlag.progress === 100) {
      this.uiFlag.progress = 30;
      const updateContent = { privacy: { ...this.setting } };
      this.userService.updateUserProfile(updateContent).subscribe((res) => {
        if (!checkResponse(res)) {
          this.uiFlag.progress = 100;
        } else {
          this.translate
            .get('hellow world')
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(() => {
              const successMsg = this.translate.instant('universal_status_updateCompleted');
              this.snackBar.open(successMsg, 'OK', { duration: 2000 });
              this.uiFlag.progress = 100;
              this.closeEditDialog();
            });
        }
      });
    }
  }

  /**
   * 展開或收合整個帳號資訊內容
   * @author kidin-1100922
   */
  handleFolder() {
    this.uiFlag.expand = !this.uiFlag.expand;
  }

  /**
   * 開啟設定彈跳框
   * @param type {SetType}-設定類別
   * @param batchEdit {boolean}-是否為批次修改
   * @author kidin-1100923
   */
  showEditDialog(type: PrivacyEditObj, batchEdit: boolean) {
    this.uiFlag.showEditDialog = type;
    this.uiFlag.batchEdit = batchEdit;
    if (!batchEdit) {
      const { activityTracking, activityTrackingReport, lifeTrackingReport } = this.setting;
      switch (type) {
        case PrivacyEditObj.file:
          this.openObj = deepCopy(activityTracking);
          break;
        case PrivacyEditObj.sportsReport:
          this.openObj = deepCopy(activityTrackingReport);
          break;
        case PrivacyEditObj.lifeTracking:
          this.openObj = deepCopy(lifeTrackingReport);
          break;
      }
    } else {
      this.openObj = [PrivacyObj.self];
      this.dateRange = RangeType.all;
    }

    // 修正日期選擇器會覆蓋生日欄位日期選擇器的問題
    this.patchEditPrivacy.emit(true);
  }

  /**
   * 關閉編輯彈跳窗
   */
  closeEditDialog() {
    if (this.uiFlag.progress === 100) {
      this.uiFlag.showEditDialog = null;
    }
  }

  /**
   * 取消設定隱私權
   * @author kidin-1100923
   */
  cancelEdit() {
    this.closeEditDialog();
    this.patchEditPrivacy.emit(false);
  }

  /**
   * 完成編輯
   * @author kidin-1100924
   */
  editComplete() {
    const { showEditDialog, batchEdit } = this.uiFlag;
    if (!batchEdit) {
      switch (showEditDialog) {
        case PrivacyEditObj.file:
          this.setting.activityTracking = deepCopy(this.openObj);
          break;
        case PrivacyEditObj.sportsReport:
          this.setting.activityTrackingReport = deepCopy(this.openObj);
          break;
        case PrivacyEditObj.lifeTracking:
          this.setting.lifeTrackingReport = deepCopy(this.openObj);
          break;
      }

      this.saveSetting();
    } else {
      this.modifyPrivacy();
    }
  }

  /**
   * 選擇修改的日期類型
   * @param type {number}-日期類型
   * @param kidin-1100924
   */
  selectDateRange(type: number) {
    this.dateRange = type;
  }

  /**
   * 取得所選日期
   * @param date {SelectDate}-所選日期
   * @author kidin-1100924
   */
  getSelectDate(date: SelectDate) {
    this.selectDate = date;
  }

  /**
   * 選擇開放隱私權的對象
   * @param obj {PrivacyObj}-開放對象
   * @author kidin-1100831
   */
  selectModifyRange(obj: PrivacyObj) {
    switch (obj) {
      case PrivacyObj.anyone:
        if (this.openObj.includes(PrivacyObj.anyone)) {
          this.openObj = [PrivacyObj.self, PrivacyObj.onlyGroupAdmin, PrivacyObj.myGroup];
        } else {
          this.openObj = [...allPrivacyItem];
        }

        break;
      case PrivacyObj.myGroup:
        if (this.openObj.includes(PrivacyObj.myGroup)) {
          this.openObj = this.openObj.filter((_setting) => {
            return _setting !== PrivacyObj.myGroup && _setting !== PrivacyObj.anyone;
          });
        } else {
          this.openObj.push(PrivacyObj.myGroup);
          // 群組管理員視為同群組成員
          if (!this.openObj.includes(PrivacyObj.onlyGroupAdmin)) {
            this.openObj.push(PrivacyObj.onlyGroupAdmin);
          }
        }

        break;
      case PrivacyObj.onlyGroupAdmin:
        if (this.openObj.includes(PrivacyObj.onlyGroupAdmin)) {
          this.openObj = this.openObj.filter((_setting) => {
            return ![obj, PrivacyObj.myGroup, PrivacyObj.anyone].includes(_setting);
          });
        } else {
          this.openObj.push(obj);
        }

        break;
      case PrivacyObj.self:
        if (this.openObj.length > 1) {
          this.openObj = [PrivacyObj.self];
        } else {
          this.openObj = [PrivacyObj.self, PrivacyObj.onlyGroupAdmin];
        }

        break;
    }

    this.openObj.sort();
  }

  /**
   * 根據使用者選擇批次修改隱私權
   * @author kidin-1100924
   */
  modifyPrivacy() {
    if (this.uiFlag.progress === 100) {
      this.uiFlag.progress = 30;
      let body: any;
      if (this.dateRange === RangeType.all) {
        body = {
          token: this.authService.token,
          editFileType: this.uiFlag.showEditDialog,
          rangeType: this.dateRange,
          privacy: this.openObj,
        };
      } else {
        body = {
          token: this.authService.token,
          editFileType: this.uiFlag.showEditDialog,
          rangeType: this.dateRange,
          startTime: this.selectDate.startDate,
          endTime: this.selectDate.endDate,
          privacy: this.openObj,
        };
      }

      this.api21xxService.fetchEditPrivacy(body).subscribe((res) => {
        let msg: string;
        if (res.resultCode === 200) {
          msg = this.translate.instant('universal_operating_finishEdit');
          this.uiFlag.progress = 100;
          this.closeEditDialog();
          this.patchEditPrivacy.emit(false);
        } else {
          msg = this.translate.instant('universal_popUpMessage_updateFailed');
          this.uiFlag.progress = 100;
        }

        this.snackBar.open(msg, 'OK', { duration: 5000 });
      });
    }
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}

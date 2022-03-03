import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { UtilsService } from '../../../../shared/services/utils.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PrivacyObj, allPrivacyItem, PrivacyEditObj } from '../../../../shared/models/user-privacy';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { SelectDate } from '../../../../shared/models/utils-type';
import { ActivityService } from '../../../../shared/services/activity.service';

enum RangeType {
  date = 1,
  all = 99
}

@Component({
  selector: 'app-setting-privacy',
  templateUrl: './setting-privacy.component.html',
  styleUrls: ['./setting-privacy.component.scss', '../personal-child-page.scss']
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
    batchEdit: false
  };

  /**
   * 使用者設定
   */
  setting = {
    activityTracking: [PrivacyObj.self],
    activityTrackingReport: [PrivacyObj.self],
    lifeTrackingReport: [PrivacyObj.self]
  };

  dateRange = RangeType.all;
  selectDate = {
    startDate: '',
    endDate: ''
  };

  openObj = [PrivacyObj.self];
  userInfo: any;
  readonly PrivacyObj = PrivacyObj;
  readonly PrivacyEditObj = PrivacyEditObj;
  readonly RangeType = RangeType;

  constructor(
    private utils: UtilsService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private userProfileService: UserProfileService,
    private activityService: ActivityService
  ) { }

  ngOnInit(): void {
    this.getRxUserProfile();
  }

  /**
   * 從rxjs取得userProfile
   * @author kidin-1100830
   */
  getRxUserProfile() {
    const checkPrivacy = (privacy: Array<string>) => {
      const transformPrivach = privacy.map(_privacy => +_privacy);
      if (transformPrivach.includes(PrivacyObj.anyone)) {
        return [...allPrivacyItem];
      } else {
        return transformPrivach;
      }

    };

    this.userProfileService.getRxTargetUserInfo().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
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
    this.uiFlag.progress = 30;
    const token = this.utils.getToken();
    const body = {
      token,
      userProfile: {
        privacy: {
          ...this.setting
        }

      }

    };

    this.userProfileService.updateUserProfile(body).subscribe(res => {
      const {processResult} = res as any;
      if (!processResult) {
        const { apiCode, resultMessage, resultCode } = res as any;
        this.utils.handleError(resultCode, apiCode, resultMessage);
      } else {
        const { apiCode, resultMessage, resultCode } = processResult;
        if (resultCode !== 200) {
          this.utils.handleError(resultCode, apiCode, resultMessage);
        } else {
          this.translate.get('hellow world').pipe(
            takeUntil(this.ngUnsubscribe)
          ).subscribe(() => {
            const successMsg = this.translate.instant('universal_status_updateCompleted');
            this.snackBar.open(successMsg, 'OK', { duration: 2000 });
          });
          
          this.uiFlag.showEditDialog = null;
        }

      }

      this.userProfileService.refreshUserProfile({ token });
      this.uiFlag.progress = 100;
    });

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
          this.openObj = this.utils.deepCopy(activityTracking);
          break;
        case PrivacyEditObj.sportsReport:
          this.openObj = this.utils.deepCopy(activityTrackingReport);
          break;
        case PrivacyEditObj.lifeTracking:
          this.openObj = this.utils.deepCopy(lifeTrackingReport);
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
   * 取消設定隱私權
   * @author kidin-1100923
   */
  cancelEdit() {
    this.uiFlag.showEditDialog = null;
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
          this.setting.activityTracking = this.utils.deepCopy(this.openObj);
          break;
        case PrivacyEditObj.sportsReport:
          this.setting.activityTrackingReport = this.utils.deepCopy(this.openObj);
          break;
        case PrivacyEditObj.lifeTracking:
          this.setting.lifeTrackingReport = this.utils.deepCopy(this.openObj);
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
  selectDateRange (type: number) {
    this.dateRange = type;
  }

  /**
   * 取得所選日期
   * @param date {SelectDate}-所選日期
   * @author kidin-1100924
   */
  getSelectDate (date: SelectDate) {
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
          this.openObj = [PrivacyObj.self];
        } else {
          this.openObj = [...allPrivacyItem];
        }

        break;
      case PrivacyObj.myGroup:

        if (this.openObj.includes(PrivacyObj.myGroup)) {
          this.openObj = this.openObj.filter(_setting => {
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
          this.openObj = this.openObj.filter(_setting => {
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
  modifyPrivacy () {
    let body: any;
    if (this.dateRange === RangeType.all) {
      body = {
        token: this.utils.getToken() || '',
        editFileType: this.uiFlag.showEditDialog,
        rangeType: this.dateRange,
        privacy: this.openObj
      };
    } else {
      body = {
        token: this.utils.getToken() || '',
        editFileType: this.uiFlag.showEditDialog,
        rangeType: this.dateRange,
        startTime: this.selectDate.startDate,
        endTime: this.selectDate.endDate,
        privacy: this.openObj
      };
    }

    this.activityService.editPrivacy(body).subscribe(res => {
      if (res.resultCode === 200) {
        const refreshBody = {
          token: this.utils.getToken() || ''
        };

        this.userProfileService.refreshUserProfile(refreshBody);
        this.snackBar.open(
          this.translate.instant(
            'universal_operating_finishEdit'
          ),
          'OK',
          { duration: 5000 }
        );

        this.uiFlag.showEditDialog = null;
        this.patchEditPrivacy.emit(false);
      } else {
        this.snackBar.open(
          this.translate.instant('universal_popUpMessage_updateFailed'),
          'OK',
          { duration: 5000 }
        );

      }

    });
    
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

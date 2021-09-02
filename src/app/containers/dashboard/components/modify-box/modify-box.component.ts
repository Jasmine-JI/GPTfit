import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../../../shared/services/utils.service';
import { SettingsService } from '../../services/settings.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { privacyObj, PrivacyCode, privacyEditObj } from '../../../../shared/models/user-privacy';


enum rangeType {
  date = 1,
  all = 99
}

@Component({
  selector: 'app-modify-box',
  templateUrl: './modify-box.component.html',
  styleUrls: ['./modify-box.component.scss']
})
export class ModifyBoxComponent implements OnInit {

  @Input() editFileType: string;
  i18n = {  // 可能再增加新的翻譯
    gym: ''
  };

  type: string;
  title: string;
  dateRange = rangeType.all;
  selectDate = {
    startDate: '',
    endDate: ''
  };
  openObj = [privacyObj.self];
  readonly privacyObj = privacyObj;
  readonly rangeType = rangeType;
  constructor(
    private utils: UtilsService,
    private settingsService: SettingsService,
    private userProfileService: UserProfileService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) { }

  ngOnInit() {
    this.translate.get('hellow world').subscribe(() => {
      this.i18n.gym = this.translate.instant('universal_group_gym');
    });

    let target;
    switch (this.data.type) {
      case privacyEditObj.file:  // 運動檔案
        target = `${this.translate.instant('universal_activityData_eventArchive')}`;
        this.title = `${this.translate.instant('universal_privacy_batchEditPrivacy', {object: target})}`;
        break;
      case privacyEditObj.sportsReport:  // 運動報告
        target = `${this.translate.instant('universal_activityData_sportsStatistics')}`;
        this.title = `${this.translate.instant('universal_privacy_batchEditPrivacy', {object: target})}`;
        break;
      case privacyEditObj.lifeTracking:  // 生活追蹤報告
        target = `${this.translate.instant('universal_lifeTracking_lifeStatistics')}`;
        this.title = `${this.translate.instant('universal_privacy_batchEditPrivacy', {object: target})}`;
        break;
    }

  }

  // 確認後即送出更改隱私權-kidin-1090331
  handleConfirm () {
    this.modifyPrivacy();
    this.dialog.closeAll();
  }

  // 選擇修改的日期類型-kidin-1090327
  selectDateRange (type: number) {
    this.dateRange = type;
  }

  // 取得所選日期-kidin-1090330
  getSelectDate (date) {
    this.selectDate = date;
  }

  /**
   * 選擇開放隱私權的對象
   * @param obj {PrivacyCode}-開放對象
   * @author kidin-1100831
   */
  selectModifyRange(obj: PrivacyCode) {
    switch (obj) {
      case privacyObj.anyone:
        if (this.openObj.indexOf(obj) >= 0) {
          this.openObj.length = 1;
        } else {
          this.openObj = [
            privacyObj.self,
            privacyObj.myGroup,
            privacyObj.onlyGroupAdmin,
            privacyObj.anyone
          ];

        }
        break;
      default:
        if (this.openObj.indexOf(obj) > 0) {
          this.openObj = this.openObj.filter(_obj => {
            return _obj !== obj && _obj !== privacyObj.anyone;
          });
        } else {
          this.openObj.push(obj);
          this.openObj.sort();
        }
        break;
    }

  }

  // 根據使用者選擇修改隱私權-kidin-1090331
  modifyPrivacy () {
    let body;
    if (this.dateRange === rangeType.all) {
      body = {
        token: this.utils.getToken() || '',
        editFileType: this.data.type,
        rangeType: this.dateRange,
        privacy: this.openObj
      };
    } else {
      body = {
        token: this.utils.getToken() || '',
        editFileType: this.data.type,
        rangeType: this.dateRange,
        startTime: this.selectDate.startDate,
        endTime: this.selectDate.endDate,
        privacy: this.openObj
      };
    }

    this.settingsService.editPrivacy(body).subscribe(res => {
      if (res.resultCode === 200) {

        const refreshBody = {
          token: this.utils.getToken() || ''
        };

        this.userProfileService.refreshUserProfile(refreshBody);

        this.snackbar.open(
          this.translate.instant(
            'universal_operating_finishEdit'
          ),
          'OK',
          { duration: 5000 }
        );
      } else {
        this.snackbar.open(
          this.translate.instant('universal_popUpMessage_updateFailed'),
          'OK',
          { duration: 5000 }
        );
      }
    });
  }

}

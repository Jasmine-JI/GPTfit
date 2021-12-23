import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { PrivacyObj, allPrivacyItem, PrivacyEditObj } from '../../../../shared/models/user-privacy';
import { ActivityService } from '../../../../shared/services/activity.service';


enum RangeType {
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
  dateRange = RangeType.all;
  selectDate = {
    startDate: '',
    endDate: ''
  };
  openObj = [PrivacyObj.self];
  readonly PrivacyObj = PrivacyObj;
  readonly RangeType = RangeType;
  constructor(
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private activityService: ActivityService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) { }

  ngOnInit() {
    this.translate.get('hellow world').subscribe(() => {
      this.i18n.gym = this.translate.instant('universal_group_gym');
    });

    let target;
    switch (this.data.type) {
      case PrivacyEditObj.file:  // 運動檔案
        target = `${this.translate.instant('universal_activityData_eventArchive')}`;
        this.title = `${this.translate.instant('universal_privacy_batchEditPrivacy', {object: target})}`;
        break;
      case PrivacyEditObj.sportsReport:  // 運動報告
        target = `${this.translate.instant('universal_activityData_sportsStatistics')}`;
        this.title = `${this.translate.instant('universal_privacy_batchEditPrivacy', {object: target})}`;
        break;
      case PrivacyEditObj.lifeTracking:  // 生活追蹤報告
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

  // 根據使用者選擇修改隱私權-kidin-1090331
  modifyPrivacy () {
    let body;
    if (this.dateRange === RangeType.all) {
      body = {
        token: this.utils.getToken() || '',
        editFileType: this.data.type,
        RangeType: this.dateRange,
        privacy: this.openObj
      };
    } else {
      body = {
        token: this.utils.getToken() || '',
        editFileType: this.data.type,
        RangeType: this.dateRange,
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

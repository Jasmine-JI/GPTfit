import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { UtilsService } from '@shared/services/utils.service';
import { SettingsService } from '../../../../services/settings.service';

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
  showPerObj = true;
  type: string;
  title: string;
  dateRange = '99';  // 1:日期 99:全部
  selectDate = {
    startDate: '',
    endDate: ''
  };
  openObj = ['1'];

  constructor(
    private utils: UtilsService,
    private settingsService: SettingsService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) { }

  ngOnInit() {
    this.translate.get('hollow world').subscribe(() => {
      this.i18n.gym = this.translate.instant('universal_group_gym');
    });

    let target;
    switch (this.data.type) {
      case '1':  // 運動檔案
        target = `${this.translate.instant('universal_activityData_eventArchive')}`;
        this.title = `${this.translate.instant('universal_privacy_batchEditPrivacy', {object: target})}`;
        break;
      case '2':  // 運動報告
        target = `${this.translate.instant('universal_activityData_sportsStatistics')}`;
        this.title = `${this.translate.instant('universal_privacy_batchEditPrivacy', {object: target})}`;
        break;
      case '3':  // 生活追蹤報告
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
  selectDateRange (e) {
    this.dateRange = e.value;
  }

  // 取得所選日期-kidin-1090330
  getSelectDate (date) {
    this.selectDate = date;
  }

  /** 選擇開放隱私權的對象-kidin-1090327
   *  1:僅自己 2:我的朋友 3:我的群組 4:我的健身房教練 99:所有人
   */
  selectModifyRange (obj) {
    const radioBtn = document.getElementById('selectObj');

    switch (obj) {
      case '99':
        if (this.openObj.indexOf(obj) >= 0) {
          radioBtn.classList.remove('mat-radio-checked');
          this.openObj.length = 1;
          this.showPerObj = true;
        } else {
          radioBtn.classList.add('mat-radio-checked');
          this.openObj.length = 1;
          this.openObj.push('99');
          this.showPerObj = false;
        }
        break;
      default:
        if (this.openObj.indexOf(obj) > 0) {
          this.openObj = this.openObj.filter(_obj => {
            return _obj !== obj;
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
    if (this.dateRange === '99') {
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

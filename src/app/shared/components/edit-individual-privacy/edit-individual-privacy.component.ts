import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';

import { UtilsService } from '../../services/utils.service';
import { SettingsService } from '../../../containers/dashboard/services/settings.service';
import { PrivacyCode } from '../../models/user-privacy';

@Component({
  selector: 'app-edit-individual-privacy',
  templateUrl: './edit-individual-privacy.component.html',
  styleUrls: ['./edit-individual-privacy.component.scss']
})
export class EditIndividualPrivacyComponent implements OnInit {
  i18n = {
    gym: ''
  };

  showPerObj = true;
  openObj = [1];

  constructor(
    private utils: UtilsService,
    private settingsService: SettingsService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) { }

  ngOnInit() {
    this.translate.get('hellow world').subscribe(() => {
      this.i18n.gym = this.translate.instant('universal_group_gym');
    });

    this.getCurrentSetting();
  }

  /**
   * 取得該筆運動檔案目前隱私權設定
   * @author kidin-1100302
   */
  getCurrentSetting() {
    setTimeout(() => {
      if (this.data.openObj.includes(1)) {
        this.openObj = [...this.data.openObj];
      } else {
        this.openObj = [1, ...this.data.openObj];
      }
      
      const radioBtn = document.getElementById('selectObj');
      if (this.openObj.includes(99)) {
        radioBtn.classList.add('mat-radio-checked');
        this.showPerObj = false;
      } else {
        radioBtn.classList.remove('mat-radio-checked');
        this.showPerObj = true;
      }

    });

  }

  /**
   * 確認後即送出更改隱私權
   * @author kidin-1100302
   */
  handleConfirm () {
    this.modifyPrivacy();
    this.dialog.closeAll();
  }

  /** 
   * 選擇開放隱私權的對象 1:僅自己 2:我的朋友 3:我的群組 4:我的健身房教練 99:所有人
   * @param obj {PrivacyCode}
   * @author kidin-1100302
   */
  selectModifyRange (obj: PrivacyCode) {
    setTimeout(() => {
      const radioBtn = document.getElementById('selectObj');

      switch (obj) {
        case 99:
          if (this.openObj.includes(obj)) {
            radioBtn.classList.remove('mat-radio-checked');
            this.openObj.length = 1;
            this.showPerObj = true;
          } else {
            radioBtn.classList.add('mat-radio-checked');
            this.openObj.length = 1;
            this.openObj.push(99);
            this.showPerObj = false;
          }
          break;
        default:
          if (this.openObj.includes(obj)) {
            this.openObj = this.openObj.filter(_obj => {
              return _obj !== obj;
            });
          } else {
            this.openObj.push(obj);
            this.openObj.sort();
          }
          break;
      }

    });

  }

  /**
   * 根據使用者選擇修改隱私權
   * @author kidin-1100302
   */
  modifyPrivacy () {
    let body;
    if (this.data.editType == 1) {
      body = {
        token: this.utils.getToken() || '',
        editFileType: this.data.editType,
        rangeType: '2',
        editFileId: [this.data.fileId],
        privacy: this.openObj
      };
    } else {
      body = {
        token: this.utils.getToken() || '',
        editFileType: this.data.editType,
        rangeType: '1',
        startTime: this.data.startDate,
        endTime: this.data.endDate,
        privacy: this.openObj
      };

    }

    this.settingsService.editPrivacy(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.data.onConfirm(this.openObj);
        this.snackbar.open(
          this.translate.instant(
            'universal_operating_finishEdit'
          ),
          'OK',
          { duration: 2000 }
        );
      } else {
        this.snackbar.open(
          this.translate.instant('universal_popUpMessage_updateFailed'),
          'OK',
          { duration: 2000 }
        );

      }

    });

  }

}

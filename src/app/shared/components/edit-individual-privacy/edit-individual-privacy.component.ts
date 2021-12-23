import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../services/utils.service';
import { PrivacyObj, allPrivacyItem } from '../../models/user-privacy';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-edit-individual-privacy',
  templateUrl: './edit-individual-privacy.component.html',
  styleUrls: ['./edit-individual-privacy.component.scss']
})
export class EditIndividualPrivacyComponent implements OnInit {
  i18n = {
    gym: ''
  };

  openObj = [PrivacyObj.self];
  readonly PrivacyObj = PrivacyObj;

  constructor(
    private utils: UtilsService,
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

    this.getCurrentSetting();
  }

  /**
   * 取得該筆運動檔案目前隱私權設定
   * @author kidin-1100302
   */
  getCurrentSetting() {
    const { openObj } = this.data;
    // 避免隱私權沒有帶到1的情況
    if (openObj.includes(PrivacyObj.self)) {
      this.openObj = [...openObj];
    } else {
      this.openObj = [PrivacyObj.self, ...openObj];
    }

    // 避免隱私權有帶3卻沒帶到4的情況
    if (
      openObj.includes(PrivacyObj.myGroup)
      && !openObj.includes(PrivacyObj.onlyGroupAdmin)
    ) {
      this.openObj.push(PrivacyObj.onlyGroupAdmin);
    }

    this.openObj.sort((a, b) => a - b);
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
   * @param privacy {PrivacyObj}
   * @author kidin-1100302
   */
  selectModifyRange (privacy: PrivacyObj) {
    const privacySetting = this.openObj;
    switch (privacy) {

      case PrivacyObj.anyone:

        if (privacySetting.includes(PrivacyObj.anyone)) {
          this.openObj = [PrivacyObj.self];
        } else {
          this.openObj = [...allPrivacyItem];
        }

        break;
      case PrivacyObj.myGroup:

        if (privacySetting.includes(PrivacyObj.myGroup)) {
          this.openObj = privacySetting.filter(_setting => {
            return _setting !== PrivacyObj.myGroup && _setting !== PrivacyObj.anyone;
          });
        } else {
          this.openObj.push(PrivacyObj.myGroup);
          // 群組管理員視為同群組成員
          if (!privacySetting.includes(PrivacyObj.onlyGroupAdmin)) {
            this.openObj.push(PrivacyObj.onlyGroupAdmin);
          }

        }

        break;
      case PrivacyObj.onlyGroupAdmin:

        if (privacySetting.includes(PrivacyObj.onlyGroupAdmin)) {
          this.openObj = privacySetting.filter(_setting => {
            return ![privacy, PrivacyObj.myGroup, PrivacyObj.anyone].includes(_setting);
          });
        } else {
          this.openObj.push(privacy);
        }

        break;
      case PrivacyObj.self:

        if (privacySetting.length > 1) {
          this.openObj = [PrivacyObj.self];
        } else {
          this.openObj = [PrivacyObj.self, PrivacyObj.onlyGroupAdmin];
        }

        break;
    }

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

    this.activityService.editPrivacy(body).subscribe(res => {
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

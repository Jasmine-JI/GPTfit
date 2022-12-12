import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../core/services';

@Component({
  selector: 'app-privacy-setting-dialog',
  templateUrl: './privacy-setting-dialog.component.html',
  styleUrls: ['./privacy-setting-dialog.component.scss'],
})
export class PrivacySettingDialogComponent implements OnInit {
  i18n = {
    // 可能再增加新的翻譯
    gym: '',
  };
  groupId: string;
  token: string;
  tempActivityTrackingReport: number[];
  tempActivityTracking: number[];
  tempLifeTracking: number[];
  showBatchChangeBox = false;

  get groupName() {
    return this.data.groupName;
  }

  get privacy() {
    return this.data.privacy;
  }

  get onConfirm() {
    return this.data.onConfirm;
  }

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
    this.translate.get('hellow world').subscribe(() => {
      this.i18n.gym = this.translate.instant('universal_group_gym');
    });

    this.setDefaultPrivacy();
  }

  /**
   * 預設隱私權設定
   * @author kidin-1091230
   */
  setDefaultPrivacy() {
    // 隱私權預設勾選「新運動檔案」、「新運動期間報告」、「新生活追蹤報告」開放給體適能教練
    this.tempActivityTracking = this.privacy.activityTracking.map((_activity) => +_activity);
    this.tempActivityTrackingReport = this.privacy.activityTrackingReport.map(
      (_activityTracking) => +_activityTracking
    );
    this.tempLifeTracking = this.privacy.lifeTrackingReport.map((_lifeTracking) => +_lifeTracking);

    if (!this.tempActivityTracking.some((_activityTracking) => +_activityTracking === 4)) {
      this.tempActivityTracking.push(4);
      this.tempActivityTracking.sort();
    }

    if (
      !this.tempActivityTrackingReport.some(
        (_activityTrackingReport) => +_activityTrackingReport === 4
      )
    ) {
      this.tempActivityTrackingReport.push(4);
      this.tempActivityTrackingReport.sort();
    }

    if (!this.tempLifeTracking.some((_lifeTrackingReport) => +_lifeTrackingReport === 4)) {
      this.tempLifeTracking.push(4);
      this.tempLifeTracking.sort();
    }
  }

  confirm() {
    const updateContent = {
      privacy: {
        activityTracking: this.tempActivityTracking,
        activityTrackingReport: this.tempActivityTrackingReport,
        lifeTrackingReport: this.tempLifeTracking,
      },
    };

    this.userService.updateUserProfile(updateContent).subscribe(() => {
      this.onConfirm();
      this.dialog.closeAll();
    });
  }

  /**
   * 變更隱私權勾選狀態
   * @param event {any}
   * @param type {1 | 2 | 3} 1:運動活動資料 2:運動期間報告 3:生活追蹤期間報告
   * @param obj {number}-開放對象 1:我自己 4:群組管理員 99:所有人
   * @author kidin-1091230
   */
  handleCheckBox(event: any, type: 1 | 2 | 3, obj: number) {
    switch (type) {
      case 1:
        if (this.tempActivityTracking.some((_activityTracking) => +_activityTracking === obj)) {
          this.tempActivityTracking = this.tempActivityTracking.filter(
            (_activityTracking) => +_activityTracking !== obj
          );
        } else {
          this.tempActivityTracking.push(obj);
          this.tempActivityTracking.sort();
        }

        break;
      case 2:
        if (
          this.tempActivityTrackingReport.some(
            (_activityTrackingReport) => +_activityTrackingReport === obj
          )
        ) {
          this.tempActivityTrackingReport = this.tempActivityTrackingReport.filter(
            (_activityTrackingReport) => +_activityTrackingReport !== obj
          );
        } else {
          this.tempActivityTrackingReport.push(obj);
          this.tempActivityTrackingReport.sort();
        }

        break;
      case 3:
        if (this.tempLifeTracking.some((_lifeTrackingReport) => +_lifeTrackingReport === obj)) {
          this.tempLifeTracking = this.tempLifeTracking.filter(
            (_lifeTrackingReport) => +_lifeTrackingReport !== obj
          );
        } else {
          this.tempLifeTracking.push(obj);
          this.tempLifeTracking.sort();
        }

        break;
    }
  }

  // 取得輸入框顯示與否的狀態-kidin-1090326
  showBox(e) {
    this.showBatchChangeBox = e;
  }
}

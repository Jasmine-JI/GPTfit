import { Component, OnInit, Inject, EventEmitter, Output, Input } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { UtilsService } from '@shared/services/utils.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-privacy-setting-dialog',
  templateUrl: './privacy-setting-dialog.component.html',
  styleUrls: [
    './privacy-setting-dialog.component.scss',
    '../../components/settings/privacy-settings/privacy-settings.component.scss'
  ]
})
export class PrivacySettingDialogComponent implements OnInit {
  groupId: string;
  token: string;
  shareTargetText: string;
  tempActivityTrackingReport: string[];
  tempActivityTracking: string[];
  tempActivityTrackingReportStatus: string[];
  tempActivityTrackingStatus: string[];
  tempLifeTracking: string[];
  tempLifeTrackingStatus: string[];
  @Output() onConfirm: EventEmitter<any> = new EventEmitter();

  get activityTrackingReport() {
    this.tempActivityTrackingReport = [...this.data.activityTrackingReport];
    return this.data.activityTrackingReport;
  }
  get activityTracking() {
    this.tempActivityTracking = [...this.data.activityTracking];
    return this.data.activityTracking;
  }
  get activityTrackingReportStatus() {
    this.tempActivityTrackingReportStatus = [...this.data.activityTrackingReportStatus];
    return this.data.activityTrackingReportStatus;
  }
  get activityTrackingStatus() {
    this.tempActivityTrackingStatus = [...this.data.activityTrackingStatus];
    return this.data.activityTrackingStatus;
  }
  get targetText() {
    return this.data.targetText;
  }
  get groupName() {
    return this.data.groupName;
  }
  constructor(
    private dialog: MatDialog,
    private utils: UtilsService,
    private settingsService: SettingsService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
    const activityTrackingArray = [],
          activityTrackingReportArray = [],
          lifeTrackingReportArray = [];

    // 隱私權預設勾選「新運動檔案」及「新運動期間報告」開放給體適能教練
    activityTrackingArray.push('1');
    activityTrackingArray.push('4');
    activityTrackingReportArray.push('1');
    activityTrackingReportArray.push('4');
    lifeTrackingReportArray.push('1');
    lifeTrackingReportArray.push('4');

    this.tempActivityTracking = activityTrackingArray;
    this.tempActivityTrackingReport = activityTrackingReportArray;
    this.tempLifeTracking = lifeTrackingReportArray;
  }

  confirm() {
    this.onConfirm.emit();
    let body;
    if (this.tempActivityTracking.length !== 0) {
      body = {
        token: this.utils.getToken() || '',
        privacy: {
          activityTracking: this.tempActivityTracking,
          activityTrackingReport: this.tempActivityTrackingReport,
          lifeTrackingReport: this.tempLifeTracking
        }
      };
    } else {
      body = {
        token: this.utils.getToken() || '',
        privacy: {
          activityTracking: this.tempActivityTracking,
          activityTrackingReport: this.tempActivityTrackingReport
        }
      };
    }


    this.settingsService.updateUserProfile(body).subscribe(() => {
      this.dialog.closeAll();
    });

  }
  handleCheckBox(event, idx, type) {
    let tempArr = [];
    let tempStatus = [];
    if (type === 1) {
      tempArr = [...this.activityTracking];
      tempStatus = [...this.activityTrackingStatus];
    } else if (type === 2) {
      tempArr = [...this.activityTrackingReport];
      tempStatus = [...this.activityTrackingReportStatus];
    } else {
      tempArr = this.tempLifeTracking;
      tempStatus = this.tempLifeTrackingStatus;
    }
    if (event.checked) {
      tempStatus[idx] = true;
      tempArr.push(event.source.value);
    } else {
      tempStatus[idx] = false;
      const i = tempArr.findIndex(x => x.value === event.source.value);
      tempArr.splice(i, 1);
    }
    if (type === 1) {
      this.tempActivityTracking = [...tempArr];
      this.tempActivityTrackingStatus = [...tempStatus];
    } else if (type === 2) {
      this.tempActivityTrackingReport = [...tempArr];
      this.tempActivityTrackingReportStatus = [...tempStatus];
    } else {
      tempArr = this.tempLifeTracking;
      tempStatus = this.tempLifeTrackingStatus;
    }
  }
}

import { Component, OnInit, Inject, EventEmitter, Output } from '@angular/core';
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

  ngOnInit() {}

  confirm() {
    this.onConfirm.emit();
    const body = {
      token: this.utils.getToken(),
      privacy: {
        activityTracking: this.tempActivityTracking,
        activityTrackingReport: this.tempActivityTrackingReport
        // lifeTrackingReport: this.lifeTrackingReport
      }
    };

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
      // tempArr = this.lifeTrackingReport;
      // tempStatus = this.lifeTrackingReportStatus;
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
      // tempArr = this.lifeTrackingReport;
      // tempStatus = this.lifeTrackingReportStatus;
    }
  }
}

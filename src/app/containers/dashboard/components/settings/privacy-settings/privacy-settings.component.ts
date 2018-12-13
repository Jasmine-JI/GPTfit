import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  Input
} from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { UtilsService } from '@shared/services/utils.service';
import { MatSnackBar } from '@angular/material';

declare var google: any;

@Component({
  selector: 'app-privacy-settings',
  templateUrl: './privacy-settings.component.html',
  styleUrls: [
    './privacy-settings.component.scss',
    '../settings.component.scss'
  ],
  encapsulation: ViewEncapsulation.None
})
export class PrivacySettingsComponent implements OnInit {
  isDisplayBox = false;
  @ViewChild('gmap') gmapElement: any;
  @Input() userData: any;
  map: any;
  mark: any;
  activityTrackingStatus = [false]; // ['mycoach'] 順序是暫時的，等其他選項確定再補
  activityTrackingReportStatus = [false]; // ['mycoach'] 順序是暫時的，等其他選項確定再補
  lifeTrackingReportStatus = [false]; // ['mycoach'] 順序是暫時的，等其他選項確定再補
  activityTracking = [];
  activityTrackingReport = [];
  lifeTrackingReport = [];
  constructor(
    private settingsService: SettingsService,
    private utils: UtilsService,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    const mapProp = {
      center: new google.maps.LatLng(24.123499, 120.66014),
      zoom: 18,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
    this.mark = new google.maps.Marker({
      position: mapProp.center,
      title: '大安'
    });
    this.mark.setMap(this.map);
    const {
      activityTracking,
      activityTrackingReport,
      lifeTrackingReport
    } = this.userData.privacy;
    this.activityTracking = activityTracking;
    this.detectCheckBoxValue(
      this.activityTracking,
      this.activityTrackingStatus
    );
    this.activityTrackingReport = activityTrackingReport;
    this.detectCheckBoxValue(
      this.activityTrackingReport,
      this.activityTrackingReportStatus
    );
    this.lifeTrackingReport = lifeTrackingReport;
    this.detectCheckBoxValue(
      this.lifeTrackingReport,
      this.lifeTrackingReportStatus
    );
  }
  mouseEnter() {
    this.isDisplayBox = true;
  }
  mouseLeave() {
    this.isDisplayBox = false;
  }
  handleCheckBox(event, idx, type) {
    let tempArr = [];
    let tempStatus = [];
    if (type === 1) {
      tempArr = this.activityTracking;
      tempStatus = this.activityTrackingStatus;
    } else if (type === 2) {
      tempArr = this.activityTrackingReport;
      tempStatus = this.activityTrackingReportStatus;
    } else {
      tempArr = this.lifeTrackingReport;
      tempStatus = this.lifeTrackingReportStatus;
    }
    if (event.checked) {
      tempStatus[idx] = true;
      tempArr.push(event.source.value);
    } else {
      tempStatus[idx] = false;
      const i = tempArr.findIndex(
        x => x.value === event.source.value
      );
      tempArr.splice(i, 1);
    }
    this.handlePrivacySetting(tempArr, type);
  }
  detectCheckBoxValue(arr, statusArr) {
    if (arr.findIndex(arrVal => arrVal === '1') === -1) {
      arr.push('1');
    }
    arr.forEach((_arr, idx) => {
      if (_arr === '') {
        arr.splice(idx, 1);
      }
      if (_arr === '4') {
        statusArr[0] = true;
      }
    });
  }
  handlePrivacySetting(arr, type) {
    const body = {
      token: this.utils.getToken(),
      privacy: {
        activityTracking: this.activityTracking,
        activityTrackingReport: this.activityTrackingReport,
        lifeTrackingReport: this.lifeTrackingReport
      }
    };
    if (type === 1) {
      body.privacy.activityTracking = arr;
    } else if (type === 2) {
      body.privacy.activityTrackingReport = arr;
    } else {
      body.privacy.lifeTrackingReport = arr;
    }
    this.settingsService.updateUserProfile(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.snackbar.open('成功更新隱私權設定', 'OK', {
          duration: 5000
        });
      } else {
        this.snackbar.open('更新失敗', 'OK', { duration: 5000 });
      }
    });
  }
}

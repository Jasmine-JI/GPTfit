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
import { deviceHint } from './deviceHint';
import { TranslateService } from '@ngx-translate/core';

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

  activityTracking = {
    checkedList: [],
    status: [false, false]
  };

  activityTrackingReport = {
    checkedList: [],
    status: [false, false]
  };

  lifeTrackingReport = {
    checkedList: [],
    status: [false, false]
  };

  deviceTip: string;
  constructor(
    private settingsService: SettingsService,
    private utils: UtilsService,
    private snackbar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const langName = this.utils.getLocalStorageObject('locale');
    this.deviceTip = deviceHint[langName];
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
    this.activityTracking.checkedList = activityTracking;
    this.detectCheckBoxValue(this.activityTracking);
    this.activityTrackingReport.checkedList = activityTrackingReport;
    this.detectCheckBoxValue(this.activityTrackingReport);
    this.lifeTrackingReport.checkedList = lifeTrackingReport;
    this.detectCheckBoxValue(this.lifeTrackingReport);
  }
  mouseEnter() {
    this.isDisplayBox = true;
  }
  mouseLeave() {
    this.isDisplayBox = false;
  }
  handleCheckBox(event, idx, type) {

    switch (type) {
      case 1:
        this.activityTracking = this.changeCheckedData(event, idx, this.activityTracking);
        break;
      case 2:
        this.activityTrackingReport = this.changeCheckedData(event, idx, this.activityTrackingReport);
        break;
      default:
        this.lifeTrackingReport = this.changeCheckedData(event, idx, this.lifeTrackingReport);
        break;
    }

    this.handlePrivacySetting();
  }

  // 取得新的設定值-kidin-1090304
  changeCheckedData (e, idx, oldData) {
    if (e.checked) {
      const set = new Set(oldData.checkedList);
      if (e.source.value === '99') {
        for (let i = 0; i < oldData.status.length; i++) {
          oldData.status[i] = true;
        }

        set.add('4');
        set.add('99');
      } else {
        set.add('4');
      }

      return {
        checkedList: Array.from(set),
        status: oldData.status
      };

    } else {
      const list = oldData.checkedList,
            status = oldData.status;
      if (list.indexOf('99') > 0 && e.source.value !== '99') {
        status[idx] = false;
        status[status.length - 1] = false;

        const i = list.indexOf(e.source.value);
        list.splice(i, 1);

        const j = list.indexOf('99');
        list.splice(j, 1);
      } else {
        status[idx] = false;

        const i = list.indexOf(e.source.value);
        list.splice(i, 1);
      }

      return {
        checkedList: list,
        status: oldData.status
      };
    }
  }

  detectCheckBoxValue(set) {
    if (set.checkedList.findIndex(arrVal => arrVal === '1') === -1) {
      set.checkedList.push('1');
    }
    set.checkedList.forEach((_arr, idx) => {
      if (_arr === '') {
        set.checkedList.splice(idx, 1);
      }
      if (_arr === '4') {
        set.status[0] = true;
      }
      if (_arr === '99') {
        set.status[1] = true;
      }
    });
  }

  handlePrivacySetting() {
    const body = {
      token: this.utils.getToken() || '',
      privacy: {
        activityTracking: this.activityTracking.checkedList,
        activityTrackingReport: this.activityTrackingReport.checkedList,
        lifeTrackingReport: this.lifeTrackingReport.checkedList
      }
    };

    this.settingsService.updateUserProfile(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.snackbar.open(
          this.translate.instant(
            'Dashboard.Settings.finishEdit'
          ),
          'OK',
          { duration: 5000 }
        );
      } else {
        this.snackbar.open(
          this.translate.instant('Dashboard.Settings.updateFailed'),
          'OK',
          { duration: 5000 }
        );
      }
    });
  }
}

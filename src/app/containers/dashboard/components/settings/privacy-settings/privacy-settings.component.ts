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
  activityTracking: string;
  activityTrackingReport: string;
  lifeTrackingReport: string;
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
      activity_tracking,
      activity_tracking_report,
      life_tracking_report
    } = this.userData.privacy;
    this.activityTracking = activity_tracking;
    this.activityTrackingReport = activity_tracking_report;
    this.lifeTrackingReport = life_tracking_report;
  }
  mouseEnter() {
    this.isDisplayBox = true;
  }
  mouseLeave() {
    this.isDisplayBox = false;
  }
  handlePrivacySetting(e, type) {
    const body = {
      token: this.utils.getToken(),
      privacy: {
        activityTracking: this.activityTracking,
        activityTrackingReport: this.activityTrackingReport,
        lifeTrackingReport: this.lifeTrackingReport
      }
    };
    if (type === 1) {
      body.privacy.activityTracking = e.target.value;
    } else if (type === 2) {
      body.privacy.activityTrackingReport = e.target.value;
    } else {
      body.privacy.lifeTrackingReport = e.target.value;
    }
    this.settingsService
      .updateUserProfile(body)
      .subscribe(res => {
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

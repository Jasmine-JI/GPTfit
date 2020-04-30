import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  Input
} from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { ModifyBoxComponent } from './modify-box/modify-box.component';
import { UtilsService } from '@shared/services/utils.service';
import { MatSnackBar, MatDialog, MAT_CHECKBOX_CLICK_ACTION } from '@angular/material';

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
  providers: [
    { provide: MAT_CHECKBOX_CLICK_ACTION, useValue: 'noop' }
  ],
  encapsulation: ViewEncapsulation.None
})
export class PrivacySettingsComponent implements OnInit {
  isDisplayBox = false;
  showBatchChangeBox = false;
  showModifyBox = false;
  editing = false;

  @ViewChild('gmap') gmapElement: any;
  @Input() userData: any;
  map: any;
  mark: any;

  editObject: string;

  activityTracking = {
    openObj: ['1'],
    showPerObj: true,
    showConfirmBtn: false
  };

  activityTrackingReport = {
    openObj: ['1'],
    showPerObj: true,
    showConfirmBtn: false
  };

  lifeTrackingReport = {
    openObj: ['1'],
    showPerObj: true,
    showConfirmBtn: false
  };

  deviceTip: string;
  constructor(
    private settingsService: SettingsService,
    private utils: UtilsService,
    private snackbar: MatSnackBar,
    private translate: TranslateService,
    private dialog: MatDialog
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
    this.activityTracking.openObj = activityTracking;
    this.detectCheckBoxValue('file');
    this.activityTrackingReport.openObj = activityTrackingReport;
    this.detectCheckBoxValue('sportFile');
    this.lifeTrackingReport.openObj = lifeTrackingReport;
    this.detectCheckBoxValue('lifeTracking');

    this.editObject = this.translate.instant('other.data');
  }
  mouseEnter() {
    this.isDisplayBox = true;
  }
  mouseLeave() {
    this.isDisplayBox = false;
  }

  /** 選擇開放隱私權的對象-kidin-1090327
   *  1:僅自己 2:我的朋友 3:我的群組 4:我的健身房教練 99:所有人
   */
  selectModifyRange (type, obj) {
    this.editing = true;

    let radioBtn;
    switch (type) {
      case 'file':
        radioBtn = document.getElementById('selectFileAll');
        this.activityTracking.showConfirmBtn = true;

        switch (obj) {
          case '99':
            if (this.activityTracking.openObj.indexOf(obj) >= 0) {

              setTimeout(() => {
                radioBtn.classList.remove('mat-radio-checked');
              }, 0);

              this.activityTracking.openObj.length = 1;
              this.activityTracking.showPerObj = true;
            } else {
              radioBtn.classList.add('mat-radio-checked');
              this.activityTracking.openObj.length = 1;
              this.activityTracking.openObj.push('99');
              this.activityTracking.showPerObj = false;
            }
            break;
          case '4':
            if (this.activityTracking.openObj.indexOf(obj) > 0) {
              this.activityTracking.openObj = this.activityTracking.openObj.filter(_obj => {
                return _obj !== obj;
              });
            } else {
              this.activityTracking.openObj.push(obj);
              this.activityTracking.openObj.sort();
            }

            break;
        }
        break;

      case 'sportReport':
        radioBtn = document.getElementById('selectSportReportAll');
        this.activityTrackingReport.showConfirmBtn = true;

        switch (obj) {
          case '99':
            if (this.activityTrackingReport.openObj.indexOf(obj) >= 0) {

              setTimeout(() => {
                radioBtn.classList.remove('mat-radio-checked');
              }, 0);

              this.activityTrackingReport.openObj.length = 1;
              this.activityTrackingReport.showPerObj = true;
            } else {
              radioBtn.classList.add('mat-radio-checked');
              this.activityTrackingReport.openObj.length = 1;
              this.activityTrackingReport.openObj.push('99');
              this.activityTrackingReport.showPerObj = false;
            }
            break;
          case '4':
            if (this.activityTrackingReport.openObj.indexOf(obj) > 0) {
              this.activityTrackingReport.openObj = this.activityTrackingReport.openObj.filter(_obj => {
                return _obj !== obj;
              });
            } else {
              this.activityTrackingReport.openObj.push(obj);
              this.activityTrackingReport.openObj.sort();
            }

            break;
        }
        break;

      case 'lifeTracking':
        radioBtn = document.getElementById('selectLifeTranckingAll');
        this.lifeTrackingReport.showConfirmBtn = true;

        switch (obj) {
          case '99':
            if (this.lifeTrackingReport.openObj.indexOf(obj) >= 0) {

              setTimeout(() => {
                radioBtn.classList.remove('mat-radio-checked');
              }, 0);

              this.lifeTrackingReport.openObj.length = 1;
              this.lifeTrackingReport.showPerObj = true;
            } else {
              radioBtn.classList.add('mat-radio-checked');
              this.lifeTrackingReport.openObj.length = 1;
              this.lifeTrackingReport.openObj.push('99');
              this.lifeTrackingReport.showPerObj = false;
            }
            break;
          case '4':
            if (this.lifeTrackingReport.openObj.indexOf(obj) > 0) {
              this.lifeTrackingReport.openObj = this.lifeTrackingReport.openObj.filter(_obj => {
                return _obj !== obj;
              });
            } else {
              this.lifeTrackingReport.openObj.push(obj);
              this.lifeTrackingReport.openObj.sort();
            }

            break;
        }
        break;
    }

  }

  detectCheckBoxValue(type) {

    let radioBtn;
    switch (type) {
      case 'file':

        if (this.activityTracking.openObj.indexOf('99') >= 0) {

          setTimeout(() => {
            radioBtn = document.getElementById('selectFileAll');
            radioBtn.classList.add('mat-radio-checked');
          }, 0);

          this.activityTracking.showPerObj = false;
        } else if (this.activityTracking.openObj.indexOf('4') >= 0) {
          this.activityTracking.showPerObj = true;
        }
        break;

      case 'sportFile':

        if (this.activityTrackingReport.openObj.indexOf('99') >= 0) {

          setTimeout(() => {
            radioBtn = document.getElementById('selectSportReportAll');
            radioBtn.classList.add('mat-radio-checked');
          }, 0);

          this.activityTrackingReport.showPerObj = false;
        } else if (this.activityTrackingReport.openObj.indexOf('4') >= 0) {
          this.activityTrackingReport.showPerObj = true;
        }
        break;

      case 'lifeTracking':

        if (this.lifeTrackingReport.openObj.indexOf('99') >= 0) {

          setTimeout(() => {
            radioBtn = document.getElementById('selectLifeTranckingAll');
            radioBtn.classList.add('mat-radio-checked');
          }, 0);

          this.lifeTrackingReport.showPerObj = false;
        } else if (this.lifeTrackingReport.openObj.indexOf('4') >= 0) {
          this.lifeTrackingReport.showPerObj = true;
        }
        break;

    }

  }

  handlePrivacySetting(type) {
    switch (type) {
      case 'file':
        this.activityTracking.showConfirmBtn = false;
        break;

      case 'sportFile':
        this.activityTrackingReport.showConfirmBtn = false;
        break;

      case 'lifeTracking':
        this.lifeTrackingReport.showConfirmBtn = false;
        break;
    }

    const body = {
      token: this.utils.getToken() || '',
      privacy: {
        activityTracking: this.activityTracking.openObj,
        activityTrackingReport: this.activityTrackingReport.openObj,
        lifeTrackingReport: this.lifeTrackingReport.openObj
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

  // 取得輸入框顯示與否的狀態-kidin-1090326
  showBox (e) {
    this.showBatchChangeBox = e;
  }

  // 顯示批次修改框-kidin-1090326
  showBatchModification (type) {
    this.dialog.open(ModifyBoxComponent, {
      hasBackdrop: true,
      minWidth: '330px',
      data: {
        type: type
      }
    });

  }
}

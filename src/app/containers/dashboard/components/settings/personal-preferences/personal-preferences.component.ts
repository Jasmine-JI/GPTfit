import { Component, OnInit, Input } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { UtilsService } from '@shared/services/utils.service';
import * as moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material';
import { MatSnackBar } from '@angular/material';
import { UserInfoService } from '../../../services/userInfo.service';
import { debounce } from '@shared/utils/';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-personal-preferences',
  templateUrl: './personal-preferences.component.html',
  styleUrls: [
    './personal-preferences.component.scss',
    '../settings.component.scss'
  ]
})
export class PersonalPreferencesComponent implements OnInit {
  settingsForm: FormGroup;
  isSaveUserSettingLoading = false;
  @Input() userData: any;
  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private utils: UtilsService,
    private snackbar: MatSnackBar,
    private userInfoService: UserInfoService,
    private translate: TranslateService
  ) {
    this.handleValueArrange = debounce(this.handleValueArrange, 1500);
  }
  get heartRateMax() {
    return (
      (this.settingsForm && this.settingsForm.get('heartRateMax').value) || null
    );
  }
  get heartRateResting() {
    return (
      (this.settingsForm && this.settingsForm.get('heartRateResting').value) ||
      null
    );
  }
  get wheelSize() {
    return (
      (this.settingsForm && this.settingsForm.get('wheelSize').value) || null
    );
  }
  ngOnInit() {
    const {
      heartRateBase,
      heartRateMax,
      heartRateResting,
      wheelSize,
      sleep: { normalBedTime, normalWakeTime }
    } = this.userData;
    this.settingsForm = this.fb.group({
      // 定義表格的預設值
      heartRateBase,
      heartRateMax,
      heartRateResting,
      normalBedTime,
      normalWakeTime,
      wheelSize
    });
  }
  logStartDateChange($event: MatDatepickerInputEvent<moment.Moment>) {
    const value = moment($event.value).format('YYYYMMDD');
    this.settingsForm.patchValue({ birthday: value });
  }
  // 判斷輪徑是否為合理值-kidin-20191031
  handleValueArrange(_value) {
    let tuneSize = '';
    if (+_value === null || +_value < 300) {
      tuneSize = '300';
    } else if (+_value > 2500) {
      tuneSize = '2500';
    } else {
      tuneSize = _value;
    }

    this.settingsForm.patchValue({ wheelSize: tuneSize });
  }
  saveSettings({ value, valid }) {
    if (valid) {
      const {
        heartRateBase,
        heartRateMax,
        heartRateResting,
        wheelSize,
        normalBedTime,
        normalWakeTime
      } = value;
      const token = this.utils.getToken();
      const body = {
        token,
        heartRateBase,
        heartRateMax: this.handleEmptyValue(heartRateMax),
        heartRateResting: this.handleEmptyValue(heartRateResting),
        wheelSize: this.handleEmptyValue(wheelSize),
        sleep: {
          normalBedTime,
          normalWakeTime
        }
      };
      this.isSaveUserSettingLoading = true;
      this.settingsService.updateUserProfile(body).subscribe(res => {
        this.isSaveUserSettingLoading = false;
        if (res.resultCode === 200) {
          this.userInfoService.getUserInfo({ token, iconType: 2 });
          this.snackbar.open(
            this.translate.instant(
              'Dashboard.Settings.finishEdit'
            ),
            'OK',
            {
              duration: 5000
            }
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
  handleEmptyValue(_value) {
    if (this.utils.isStringEmpty(_value)) {
      return '0';
    }
    return _value;
  }
}

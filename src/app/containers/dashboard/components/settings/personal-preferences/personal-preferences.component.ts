import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { UtilsService } from '@shared/services/utils.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { inch } from '../../../../../shared/models/bs-constant';

@Component({
  selector: 'app-personal-preferences',
  templateUrl: './personal-preferences.component.html',
  styleUrls: [
    './personal-preferences.component.scss',
    '../settings.component.scss'
  ]
})
export class PersonalPreferencesComponent implements OnInit, OnChanges {
  settingsForm: FormGroup;
  isSaveUserSettingLoading = false;
  blockSaveButton = false;
  heartRateBase: number;
  unit: number;
  inch = inch;
  @Input() userData: any;

  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private utils: UtilsService,
    private snackbar: MatSnackBar,
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) {}
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
  get stepLength() {
    return (
      (this.settingsForm && this.settingsForm.get('stepLength').value) || null
    );
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    const {
      heartRateBase,
      heartRateMax,
      heartRateResting,
      wheelSize,
      normalBedTime,
      normalWakeTime,
      unit,
      strideLengthCentimeter
    } = this.userData;

    this.heartRateBase = +heartRateBase;
    this.unit = unit;
    this.settingsForm = this.fb.group({
      // 定義表格的預設值
      heartRateBase,
      heartRateMax,
      heartRateResting,
      normalBedTime,
      normalWakeTime,
      wheelSize,
      unit,
      stepLength: unit === 0 ? strideLengthCentimeter : +(strideLengthCentimeter / inch).toFixed(2)
    });
  }

  /**
   * 判斷心率是否為合理值(Bug 578)
   * @event focusout
   * @param type {string}-欄位類別
   * @param e {FocusEvent}
   * @author kidin-1090723
   */
  handleHrValueArrange(type: string, e: FocusEvent) {
    const inputHrValue = (e as any).target.value;
    let hrValue = '';

    if (type === 'maxHr') {
      if (inputHrValue >= 140 && inputHrValue <= 220) {
        hrValue = inputHrValue;
      } else if (inputHrValue > 220) {
        hrValue = '220';
      } else {
        hrValue = '140';
      }
      this.settingsForm.patchValue({ heartRateMax: hrValue });
    } else {
      if (inputHrValue >= 40 && inputHrValue <= 100) {
        hrValue = inputHrValue;
      } else if (inputHrValue > 100) {
        hrValue = '100';
      } else {
        hrValue = '40';
      }
      this.settingsForm.patchValue({ heartRateResting: hrValue });
    }
  }

  /**
   * 判斷輪徑是否為合理值(Bug 578)
   * @event focusout
   * @param e {FocusEvent}
   * @author kidin-20191120
   */
  handleWheelValueArrange(e: FocusEvent) {
    const inputWheelValue = (e as any).target.value;
    let tuneSize = '';
    if (inputWheelValue >= 300 && inputWheelValue <= 9000) {
      tuneSize = inputWheelValue;
    } else if (inputWheelValue > 9000) {
      tuneSize = '9000';
    } else {
      tuneSize = '300';
    }
    this.settingsForm.patchValue({ wheelSize: tuneSize });
  }

  /**
   * 判斷步距是否為合理值
   * @event focusout
   * @param e {FocusEvent}
   * @author kidin-1100106
   */
  handlestepLengthArrange(e: FocusEvent) {
    let inputStepLength = (e as any).target.value;
    if (this.unit === 1) {
      inputStepLength = inputStepLength * inch;
    }

    if (inputStepLength > 255) {
      inputStepLength = this.unit === 0 ? 255 : +(255 / inch).toFixed(2);
    } else if (inputStepLength < 30) {
      inputStepLength = this.unit === 0 ? 30 : +(30 / inch).toFixed(2);
    }

    this.settingsForm.patchValue({ stepLength: inputStepLength });
  }

  /**
   * 當使用者按下儲存時，call api更新資料
   * @param { value, valid }
   * @author kidin-1090723
   */
  saveSettings({ value, valid }) {
    if (valid) {
      const {
        heartRateBase,
        heartRateMax,
        heartRateResting,
        wheelSize,
        normalBedTime,
        normalWakeTime,
        unit,
        stepLength
      } = value;

      const token = this.utils.getToken() || '';
      const body = {
        token,
        userProfile: {
          heartRateBase,
          heartRateMax,
          heartRateResting,
          wheelSize,
          normalBedTime,
          normalWakeTime,
          unit,
          strideLengthCentimeter: this.unit === 0 ? stepLength : stepLength * inch
        }

      };
      this.isSaveUserSettingLoading = true;
      this.settingsService.updateUserProfile(body).subscribe(res => {
        this.isSaveUserSettingLoading = false;
        if (res.processResult.resultCode === 200) {
          // 重新存取身體資訊供各種圖表使用-kidin-1081212
          this.userProfileService.refreshUserProfile({
            token,
          });

          this.snackbar.open(
            this.translate.instant(
              'universal_operating_finishEdit'
            ),
            'OK',
            {
              duration: 5000
            }
          );

        } else {
          this.snackbar.open(
            this.translate.instant('universal_popUpMessage_updateFailed'),
            'OK',
            { duration: 5000 }
          );
        }
      });
    }
  }

  /**
   * 取得使用者選擇的心率演算法
   * @event change
   * @param e {changeEvent}
   */
  handleHeartRateBase (e: Event) {
    this.heartRateBase = +(e as any).target.value;
  }

  /**
   * 取得使用者選擇的單位
   * @event change
   * @param e {changeEvent}-0: 公制 1:英制
   * @author kidin-1100106
   */
  handleUnit(e: Event) {
    let inputStepLength = this.unit === 0 ? +(this.stepLength / inch).toFixed(2) : this.stepLength * inch;
    this.settingsForm.patchValue({ stepLength: inputStepLength });
    this.unit = +(e as any).target.value;
  }

}

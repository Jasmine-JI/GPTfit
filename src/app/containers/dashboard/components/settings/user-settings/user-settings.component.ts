import { Component, OnInit, Input } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { UtilsService } from '@shared/services/utils.service';
import * as moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { MatSnackBar } from '@angular/material';
import { UserInfoService } from '../../../services/userInfo.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss', '../settings.component.scss']
})
export class UserSettingsComponent implements OnInit {
  reloadFileText = '重新上傳';
  chooseFileText = '選擇檔案';
  acceptFileExtensions = ['JPG', 'JPEG', 'GIF', 'PNG'];
  userIcon: string;
  settingsForm: FormGroup;
  inValidText = '欄位為必填';
  isNameError = false;
  isNameLoading = false;
  isSaveUserSettingLoading = false;
  imgCropping = false;
  updateQueryString: string;

  @Input() userData: any;
  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private utils: UtilsService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private userInfoService: UserInfoService,
    private translate: TranslateService
  ) {}
  get nameIcon() {
    return <FormArray>this.settingsForm.get('nameIcon');
  }
  get name() {
    return <FormArray>this.settingsForm.get('name');
  }
  get height() {
    return <FormArray>this.settingsForm.get('height');
  }
  get weight() {
    return <FormArray>this.settingsForm.get('weight');
  }
  get birthday() {
    if (this.settingsForm && this.settingsForm.get('birthday').value) {
      return moment(this.settingsForm.get('birthday').value);
    }
    return moment();
  }
  get description() {
    return (
      (this.settingsForm && this.settingsForm.get('description').value) || null
    );
  }
  ngOnInit() {
    const {
      name,
      nameIcon,
      height,
      weight,
      birthday,
      description
    } = this.userData;
    const gender = this.userData.gender === '2' ? '0' : this.userData.gender; // 如果接到性別為無(2)就轉成男生

    // 確認頭像有無更新-kidin-1090113
    this.userInfoService.getUpdatedImgStatus().subscribe(res => {
      this.updateQueryString = res;
    });

    this.settingsForm = this.fb.group({
      // 定義表格的預設值
      nameIcon: [
        `${nameIcon} ${this.updateQueryString}`,
        Validators.required
      ],
      name: [name, Validators.required],
      height: [height, Validators.required],
      weight: [weight, Validators.required],
      birthday,
      gender,
      description
    });

    this.utils.getImgSelectedStatus().subscribe(res => {
      this.imgCropping = res;
    });
  }
  handleValueArrange(type, e) {
    const inputHeightValue = e.target.value;
    let tuneHeight = '';
    let tuneWeight = '';

    if (inputHeightValue) {
      if (type === 1) {
        // type 1為身高 2為體重
        if (inputHeightValue < 100) {
          tuneHeight = '100';
        } else if (inputHeightValue > 255) {
          tuneHeight = '255';
        } else {
          tuneHeight = inputHeightValue;
        }
      } else {
        if (inputHeightValue < 40) {
          tuneWeight = '40';
        } else if (inputHeightValue > 255) {
          tuneWeight = '255';
        } else {
          tuneWeight = inputHeightValue;
        }
      }
    }
    if (type === 1) {
      this.settingsForm.patchValue({ height: tuneHeight });
    } else {
      this.settingsForm.patchValue({ weight: tuneWeight });
    }
  }
  handleSearchName(name) {
    const token = this.utils.getToken() || '';
    const body = {
      token,
      name
    };
    this.isNameLoading = true;
    this.settingsService.updateUserProfile(body).subscribe(res => {
      this.isNameLoading = false;
      if (res.resultCode === 200) {
        this.userInfoService.getUserInfo({
          token,
          avatarType: 2,
          iconType: 2
        });
        this.settingsForm.patchValue({ name });
        this.isNameError = false;
        this.inValidText = this.translate.instant('universal_userAccount_fullField');
      } else {
        this.inValidText = `${this.translate.instant('universal_activityData_name')} ${this.translate.instant('universal_deviceSetting_repeat')}`;
        this.isNameError = true;
      }
    });
  }
  public onNameChange(e: any, form: FormGroup): void {
    const inputNameString = e.target.value;
    if (inputNameString.length > 0 && form.controls['name'].status === 'VALID') {
      this.handleSearchName(inputNameString);
    }
  }
  handleChangeTextarea(text: string, type: number): void {
    if (type === 1) {
      return this.settingsForm.patchValue({ description: text });
    }
  }

  logStartDateChange($event: MatDatepickerInputEvent<moment.Moment>) {
    const inputBirthdayValue = moment($event.value);
    let value = moment($event.value).format('YYYYMMDD');
    if (inputBirthdayValue.isBetween('19390101', moment())) {
      this.settingsForm.patchValue({ birthday: value });
    } else {
      value = (Number(moment().format('YYYYMMDD')) - 300000) + '';
      this.settingsForm.patchValue({ birthday: value });
    }
  }

  saveSettings({ value, valid }) {
    if (!value.nameIcon || value.nameIcon.length === 0) {
      return this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: this.translate.instant('universal_operating_selectImg'),
          confirmText: this.translate.instant('universal_operating_confirm')
        }
      });
    }
    if (valid && !this.isNameError) {
      const {
        name,
        nameIcon,
        height,
        weight,
        birthday,
        gender,
        description
      } = value;
      const token = this.utils.getToken() || '';
      const image = new Image();
      const icon = {
        iconLarge: '',
        iconMid: '',
        iconSmall: ''
      };
      image.src = nameIcon;

      image.onload = () => {
        icon.iconLarge = this.imageToDataUri(image, 256, 256);
        icon.iconMid = this.imageToDataUri(image, 128, 128);
        icon.iconSmall = this.imageToDataUri(image, 64, 64);
        const body = {
          token,
          name,
          icon,
          height: this.handleEmptyValue(height),
          weight: this.handleEmptyValue(weight),
          birthday,
          gender,
          description
        };
        this.isSaveUserSettingLoading = true;
        this.settingsService.updateUserProfile(body).subscribe(res => {
          this.isSaveUserSettingLoading = false;
          if (res.resultCode === 200) {
            this.userInfoService.getUserInfo({
              token,
              avatarType: 2,
              iconType: 2
            });

            // 此字串為更新頭像時，icon url添加的query string-kidin-1090107
            this.userInfoService.setUpdatedImgStatus(`?${moment().format('YYYYMMDDhhmmss')}`);

            this.snackbar.open(
              this.translate.instant(
                'universal_operating_finishEdit'
              ),
              'OK',
              { duration: 5000 }
            );

            // 重新存取身體資訊供各種圖表使用-kidin-1081212
            const key = {
              token: token,
              avatarType: 2,
              iconType: 2
            };
            this.userInfoService.getLogonData(key).subscribe(result => {
              const data = {
                name: result.info.name,
                birthday: result.info.birthday,
                heartRateBase: result.info.heartRateBase,
                heartRateMax: result.info.heartRateMax,
                heartRateResting: result.info.heartRateResting,
                height: result.info.height,
                weight: result.info.weight,
                wheelSize: result.info.wheelSize
              };
              this.userInfoService.saveBodyDatas(data);
            });
          } else {
            this.snackbar.open(
              this.translate.instant('universal_popUpMessage_updateFailed'),
              'OK',
              { duration: 5000 }
            );
            this.userInfoService.setUpdatedImgStatus('');
          }
        });
      }
    }
  }
  handleEmptyValue(_value) {
    if (this.utils.isStringEmpty(_value)) {
      return '0';
    }
    return _value;
  }
  imageToDataUri(img, width, height) {
    // create an off-screen canvas
    const canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

    // set its dimension to target size
    canvas.width = width;
    canvas.height = height;

    // draw source image into the off-screen canvas:
    ctx.drawImage(img, 0, 0, width, height);

    // encode image to data-uri with base64 version of compressed image
    return canvas.toDataURL().replace('data:image/png;base64,', '');
  }
  handleAttachmentChange(file) {
    if (file) {
      const { isTypeCorrect, errorMsg, link } = file;
      if (!isTypeCorrect) {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: errorMsg
          }
        });
      } else {
        this.settingsForm.patchValue({nameIcon: link});
      }
    }
  }

  // 取消按enter鍵(Bug 1104)-kidin-1090415
  handleKeyDown (e) {
    if (e.key === 'Enter') {
      return false;
    }
  }

}

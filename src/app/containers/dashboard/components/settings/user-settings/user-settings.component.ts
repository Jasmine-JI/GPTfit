import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { UtilsService } from '@shared/services/utils.service';
import moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserInfoService } from '../../../services/userInfo.service';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { formTest } from '../../../../portal/models/form-test';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss', '../settings.component.scss']
})
export class UserSettingsComponent implements OnInit, OnChanges {

  readonly nicknameReg = formTest.nickname;

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
  anyChange = false;
  newIcon = '';

  @Input() userData: any;
  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private utils: UtilsService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private userInfoService: UserInfoService,
    private translate: TranslateService,
    private userProfileService: UserProfileService
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

  ngOnInit(): void {}

  ngOnChanges(): void {
    // 若使用者已更動部份資訊（尚未點選儲存，但已修改暱稱）
    if (!this.anyChange) {
      let {
        nickname,
        avatarUrl,
        bodyHeight,
        bodyWeight,
        birthday,
        description,
        editTimeStamp
      } = this.userData;
      const gender = this.userData.gender === '2' ? '0' : this.userData.gender; // 如果接到性別為無(2)就轉成男生

      this.settingsForm = this.fb.group({
        // 定義表格的預設值
        nameIcon: [
          `${avatarUrl}?${editTimeStamp}`,
          Validators.required
        ],
        name: [nickname, Validators.required],
        height: [bodyHeight, Validators.required],
        weight: [bodyWeight, Validators.required],
        birthday,
        gender,
        description
      });

      this.utils.getImgSelectedStatus().subscribe(res => {
        this.imgCropping = res;
      });

    }

  }

  /**
   * 若使用者輸入的身高或體重不符合合理值就將其轉為合理值上限或下限
   * @event focusout
   * @param type {number}
   * @param e {FocusoutEvent}
   * @author kidin-1090723
   */
  handleValueArrange(type: number, e: FocusEvent): void {
    const inputHeightValue = (e as any).target.value;
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
      this.anyChange = true;
      this.settingsForm.patchValue({ height: tuneHeight });
    } else {
      this.anyChange = true;
      this.settingsForm.patchValue({ weight: tuneWeight });
    }

  }

  /**
   * 去除暱稱頭尾空白，並call api 1011更新會員資料來確認是否暱稱重複
   * @param name {string}
   * @author kidin-1090723
   */
  handleSearchName(name: string): void {
    const trimNickname = name.replace(/(^[\s]*)|([\s]*$)/g, '');
    this.settingsForm.patchValue({name: trimNickname});

    if (!this.nicknameReg.test(trimNickname)) {
      this.inValidText = this.translate.instant('universal_userAccount_nameCharactersToLong');
      this.isNameError = true;
    } else {
      const token = this.utils.getToken() || '';
      const body = {
        token,
        userProfile: {
          nickname: trimNickname
        }
      };

      this.isNameLoading = true;
      this.settingsService.updateUserProfile(body).subscribe(res => {
        this.isNameLoading = false;
        if (res.processResult && res.processResult.resultCode === 200) {
          this.userProfileService.refreshUserProfile({
            token,
          });

          this.isNameError = false;
          this.inValidText = this.translate.instant('universal_userAccount_fullField');
        } else if (res.resultCode === 400) {
          this.inValidText = `error`;
          this.isNameError = true;
        } else {
          this.inValidText = `${this.translate.instant('universal_activityData_name')} ${this.translate.instant('universal_deviceSetting_repeat')}`;
          this.isNameError = true;
        }

      });

    }

  }

  /**
   * 當使用者輸入暱稱完畢後，自動call api確認是否重複暱稱重複
   * @event {FocusoutEvent}
   * @param e {FocusEvent}
   * @param form {FormGroup}
   * @author kidin-1090723
   */
  public onNameChange(e: FocusEvent, form: FormGroup): void {
    const inputNameString = (e as any).target.value;
    if (inputNameString.length > 0 && form.controls['name'].status === 'VALID') {
      this.handleSearchName(inputNameString);
    }
  }

  /**
   * 處理使用者輸入自我介紹
   * @param text {string}
   * @param type {number}
   * @author kidin-1090723
   */
  handleChangeTextarea(text: string, type: number): void {
    if (type === 1) {
      this.anyChange = true;
      return this.settingsForm.patchValue({ description: text });
    }
  }

  /**
   * 處理不合理生日日期
   * @param $event {MatDatepickerInputEvent}
   * @author kidin-1090723
   */
  logStartDateChange($event: MatDatepickerInputEvent<moment.Moment>) {
    const inputBirthdayValue = moment($event.value);
    let value = moment($event.value).format('YYYYMMDD');
    if (inputBirthdayValue.isBetween('19390101', moment())) {
      this.anyChange = true;
      this.settingsForm.patchValue({ birthday: value });
    } else {
      value = (Number(moment().format('YYYYMMDD')) - 300000) + '';
      this.anyChange = true;
      this.settingsForm.patchValue({ birthday: value });
    }
  }

  /**
   * 使用者點選儲存後，call api更新使用者資料。
   * @event click
   * @param {value, valid}
   * @author kidin-1090723
   */
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
      const avatar = {
        large: '',
        mid: '',
        small: ''
      };

      if (location.hostname === 'www.gptfit.com') {
        image.src = nameIcon.replace('cloud.alatech.com.tw', 'www.gptfit.com');
      } else {
        image.src = nameIcon;
      }

      image.setAttribute('crossOrigin', 'Anonymous');

      image.onload = () => {
        avatar.large = this.imageToDataUri(image, 256, 256);
        avatar.mid = this.imageToDataUri(image, 128, 128);
        avatar.small = this.imageToDataUri(image, 64, 64);

        const body = {
          token,
          userProfile: {
            nickname: name,
            avatar,
            bodyHeight: height,
            bodyWeight: weight,
            birthday,
            gender,
            description
          }

        };

        this.isSaveUserSettingLoading = true;
        this.settingsService.updateUserProfile(body).subscribe(res => {
          this.isSaveUserSettingLoading = false;
          if (res.processResult && res.processResult.resultCode === 200) {
            // 重新存取身體資訊供各種圖表使用-kidin-1081212
            this.userProfileService.refreshUserProfile({
              token,
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

          } else {
            this.snackbar.open(
              this.translate.instant('universal_popUpMessage_updateFailed'),
              'OK',
              { duration: 5000 }
            );
            this.userInfoService.setUpdatedImgStatus('');
          }
        });
      };
    }
  }

  /**
   * 將圖片裁切成所需大小並轉成base64
   * @param img {Image}
   * @param width {number}
   * @param height {number}
   */
  imageToDataUri(img: any, width: number, height: number) {
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

  /**
   * 處理使用者選擇完照片
   * @param file any
   * @author kidin-1090723
   */
  handleAttachmentChange(file: any): void {
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
        this.anyChange = true;
        this.newIcon = link;
        this.settingsForm.patchValue({nameIcon: link});
      }
    }

  }

  /**
   * 輸入生日時禁止使用enter鍵(Bug 1104)
   * @event keydown
   * @param e {keyBoardEvent}
   * @author kidin-1090723
   */
  handleKeyDown(e: KeyboardEvent): boolean {
    if (e.key === 'Enter') {
      return false;
    }
  }

}

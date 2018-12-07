import { Component, OnInit, Input } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { UtilsService } from '@shared/services/utils.service';
import * as moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { MatSnackBar } from '@angular/material';
import { debounce } from '@shared/utils/';
import { UserInfoService } from '../../../services/userInfo.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss', '../settings.component.scss']
})
export class UserSettingsComponent implements OnInit {
  isUploading = false;
  reloadFileText = '重新上傳';
  chooseFileText = '選擇檔案';
  acceptFileExtensions = ['JPG', 'JPEG', 'GIF', 'PNG'];
  maxFileSize = 1048576;
  userIcon: string;
  settingsForm: FormGroup;
  inValidText = '欄位為必填';
  isNameError = false;
  isNameLoading = false;
  isSaveUserSettingLoading = false;
  @Input() userData: any;
  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private utils: UtilsService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private userInfoService: UserInfoService
  ) {
    this.handleSearchName = debounce(this.handleSearchName, 1500);
    this.handleValueArrange = debounce(this.handleValueArrange, 1500);
  }
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
    this.settingsForm = this.fb.group({
      // 定義表格的預設值
      nameIcon: [
        this.utils.buildBase64ImgString(nameIcon),
        Validators.required
      ],
      name: [name, Validators.required],
      height: [height, Validators.required],
      weight: [weight, Validators.required],
      birthday,
      gender,
      description
    });
  }
  handleValueArrange(type, _value) {
    let tuneHeight = '';
    let tuneWeight = '';

    if (_value) {
      if (type === 1) { // type 1為身高 2為體重
        if (+_value < 50) {
          tuneHeight = '50';
        } else if (+_value > 255) {
          tuneHeight = '255';
        } else {
          tuneHeight = _value;
        }
      } else {
        if (+_value < 30) {
          tuneWeight = '30';
        } else if (+_value > 255) {
          tuneWeight = '255';
        } else {
          tuneWeight = _value;
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
    const token = this.utils.getToken();
    const body = {
      token,
      name
    };
    this.isNameLoading = true;
    this.settingsService.updateUserProfile(body).subscribe(res => {
      this.isNameLoading = false;
      if (res.resultCode === 200) {
        this.userInfoService.getUserInfo({ token, iconType: 2 });
        this.settingsForm.patchValue({ name });
        this.isNameError = false;
        this.inValidText = '欄位為必填';
      } else {
        this.inValidText = '名稱已存在';
        this.isNameError = true;
      }
    });
  }
  public onNameChange(text: any, form: FormGroup): void {
    if (text.length > 0 && form.controls['name'].status === 'VALID') {
      this.handleSearchName(text.trim());
    }
  }
  handleChangeTextarea(text: string, type: number): void {
    if (type === 1) {
      return this.settingsForm.patchValue({ description: text });
    }
  }
  logStartDateChange($event: MatDatepickerInputEvent<moment.Moment>) {
    const value = moment($event.value).format('YYYYMMDD');
    this.settingsForm.patchValue({ birthday: value });
  }
  saveSettings({ value, valid }) {
    if (value.nameIcon && value.nameIcon.length === 0) {
      return this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: `請上傳照片`,
          confirmText: '確定'
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
      const token = this.utils.getToken();
      const image = new Image();
      const icon = {
        iconLarge: '',
        iconMid: '',
        iconSmall: ''
      };
      image.src = nameIcon;

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
          this.userInfoService.getUserInfo({ token, iconType: 2 });
          this.snackbar.open('成功更新使用者資訊', 'OK', {
            duration: 5000
          });
        } else {
          this.snackbar.open('更新失敗', 'OK', { duration: 5000 });
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
      const { isSizeCorrect, isTypeCorrect, errorMsg, link } = file;
      if (!isSizeCorrect || !isTypeCorrect) {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: errorMsg
          }
        });
      } else {
        this.settingsForm.patchValue({ nameIcon: link });
      }
    }
  }
}

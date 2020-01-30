import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { AuthService } from '@shared/services/auth.service';
import { UtilsService } from '@shared/services/utils.service';
import { MatSnackBar, MatDatepickerInputEvent } from '@angular/material';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-first-login',
  templateUrl: './first-login.component.html',
  styleUrls: ['./first-login.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FirstLoginComponent implements OnInit {
  startDate = new Date(1988, 6, 1);
  form: FormGroup;
  content = '送出';
  className = 'btn btn-primary access-btn';
  isLogining = false;
  userImg = '/assets/images/user.png';
  reloadFileText = '重新上傳';
  chooseFileText = '上傳相片';
  acceptFileExtensions = ['JPG', 'JPEG', 'GIF', 'PNG'];
  finalImageLink: string;
  isDuplicateName = false;
  tempDuplicateName: string;
  imgCropping = false;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private utils: UtilsService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const isFirstLogin =
      this.utils.getSessionStorageObject('isFirstLogin') || false;
    if (!isFirstLogin) {
      return this.router.navigateByUrl('/404');
    }

    const userName = this.authService.userName || '';
    this.form = this.fb.group({
      userName: [userName, Validators.required],
      height: [175, Validators.required],
      weight: [75, Validators.required],
      gender: 0,
      birth: (Number(moment().format('YYYYMMDD')) - 300000) + ''
    });

    // 修復在首次登入頁面按下登出時，畫面殘留的問題-kidin-1090109(bug575)
    this.authService.getLoginStatus().subscribe(res => {
      if (res === false) {
        return this.router.navigateByUrl('/signin');
      }
    });

    this.utils.getImgSelectedStatus().subscribe(res => {
      this.imgCropping = res;
    });
  }
  submit({ valid, value }) {
    const icon = {
      iconLarge: '',
      iconMid: '',
      iconSmall: ''
    };
    if (!this.finalImageLink || this.finalImageLink.length === 0) {
      return this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: this.translate.instant(
            'Dashboard.Settings.selectImg'
          ),
          confirmText: this.translate.instant('SH.determine')
        }
      });
    } else {
      const image = new Image();
      image.src = this.finalImageLink || '';
      icon.iconLarge = this.imageToDataUri(image, 256, 256);
      icon.iconMid = this.imageToDataUri(image, 128, 128);
      icon.iconSmall = this.imageToDataUri(image, 64, 64);
    }

    const { userName, height, weight, gender, birth } = value;
    const body = {
      token: this.utils.getToken(),
      icon,
      name: userName,
      height,
      weight,
      gender,
      birth
    };
    if (valid) {
      this.isLogining = true;
      this.authService.updateUserProfile(body).subscribe(res => {
        this.isLogining = false;
        if (res.resultCode === 409) {
          this.isDuplicateName = true;
          this.tempDuplicateName = userName;
        } else {
          this.isDuplicateName = false;
          this.tempDuplicateName = '';
        }
        if (res.resultCode === 200 && this.authService.backUrl.length > 0) {
          this.utils.removeSessionStorageObject('isFirstLogin');
          return (location.href = this.authService.backUrl);
        }
        if (res.resultCode === 200) {
          this.utils.removeSessionStorageObject('isFirstLogin');
          return (location.href = '/dashboard');
        }
        // if (res) {
        //   this.snackbar.open('登入成功', 'OK', { duration: 5000 });
        // } else {
        //   this.snackbar.open('請檢查使用者名稱及密碼', 'OK', {
        //     duration: 5000
        //   });
        // }
      });
    }
  }
  handleDuplicateStatus(e) {
    if (this.tempDuplicateName && this.tempDuplicateName.length > 0) {
      const currentName = e.target.value;
      if (currentName !== this.tempDuplicateName) {
        this.tempDuplicateName = '';
        this.isDuplicateName = false;
      }
    }
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
  logStartDateChange($event: MatDatepickerInputEvent<moment.Moment>) {
    const inputBirthdayValue = moment($event.value)
    let value = moment($event.value).format('YYYYMMDD');
    if (inputBirthdayValue.isBetween('19390101', moment())) {
      this.form.patchValue({ birth: value });
    } else {
      // 修正生日不符範圍值(預設年齡30歲)-kidin-1081216(bug 576)
      value = (Number(moment().format('YYYYMMDD')) - 300000) + '';
      this.form.patchValue({ birth: value });
    }
  }
  handleAttachmentChange(file) {
    if (file) {
      const {isTypeCorrect, errorMsg, link } = file;
      if (!isTypeCorrect) {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: errorMsg
          }
        });
      } else {
        this.finalImageLink = link;
      }
    }
  }
  // 判斷身高體重是否為合理值-kidin-1081120(Bug 576)
  handleHWValue(type, e) {
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
      this.form.patchValue({ height: tuneHeight });
    } else {
      this.form.patchValue({ weight: tuneWeight });
    }
  }
}

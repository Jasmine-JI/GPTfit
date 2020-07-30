import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '@shared/services/auth.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { UtilsService } from '@shared/services/utils.service';
import { SignupService } from '../../../services/signup.service';

@Component({
  selector: 'app-app-first-login',
  templateUrl: './app-first-login.component.html',
  styleUrls: ['./app-first-login.component.scss']
})
export class AppFirstLoginComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  i18n = {
    birthday: '',
    bodyHeight: '',
    bodyWeight: ''
  };
  sending = false;
  dataIncomplete = false;
  acceptFileExtensions = ['JPG', 'JPEG', 'GIF', 'PNG'];
  userImg = '/assets/images/user2.png';
  finalImageLink: string;
  pcView = false;
  nickName: string;

  editBody = {
    token: '',
    userProfile: {
      gender: '0',
      avatar: {
        large: '',
        mid: '',
        small: ''
      },
      bodyHeight: 175,
      bodyWeight: 70,
      birthday: 19900101,
    }
  };

  // 可能新增其他錯誤提示訊息，故暫用obj
  cue = {
    birthday: '',
    bodyHeight: '',
    bodyWeight: ''
  };

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private signupService: SignupService
  ) {
    translate.onLangChange.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.getTranslate();
    });

  }

  ngOnInit() {
    this.getTranslate();

    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
    }

    this.getDefaultBirthday();
    this.editBody.token = this.utils.getToken() || '';
    this.getUserInfo();

    // 在首次登入頁面按下登出時，跳轉回登入頁-kidin-1090109(bug575)
    this.authService.getLoginStatus().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      if (res === false && this.pcView === true) {
        return this.router.navigateByUrl('/signIn-web');
      }
    });

  }

  // 取得多國語系翻譯-kidin-1090620
  getTranslate () {
    this.translate.get('hollo word').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.i18n = {
        birthday: this.translate.instant('universal_userProfile_birthday'),
        bodyHeight: this.translate.instant('universal_userProfile_bodyHeight'),
        bodyWeight: this.translate.instant('universal_userProfile_bodyWeight')
      };

    });

  }

  // 取得使用者選擇的照片-kidin-1090526
  handleAttachmentChange(file) {
    if (file) {
      const {isTypeCorrect, errorMsg, link } = file;
      if (!isTypeCorrect) {

      } else {
        this.finalImageLink = link;
      }
    }
  }

  // 取得預設生日(30歲)-kidin-1090525
  getDefaultBirthday () {
    const currentYear = +moment().year();
    this.editBody.userProfile.birthday = +`${currentYear - 30}0101`;
  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo () {
    const body = {
      token: this.utils.getToken() || ''
    };

    this.userProfileService.getUserProfile(body).subscribe(res => {
      this.nickName = res.userProfile.nickname;
    });

  }

  // 確認生日是否為異常值-kidin-1090525
  checkBirthday (e) {
    const inputBirthday = e.currentTarget.value,
          currentYear = +moment().year();
    if ((e.type === 'keypress' && e.key === 'Enter') || e.type === 'focusout') {

      if (inputBirthday.length === 0) {
        this.editBody.userProfile.birthday = +`${currentYear - 30}0101`;
      } else if (+inputBirthday < +`${currentYear - 80}0101`) {
        this.editBody.userProfile.birthday = +`${currentYear - 80}0101`;
      } else if (+inputBirthday > +`${currentYear - 12}1231`) {
        this.editBody.userProfile.birthday = +`${currentYear - 12}1231`;
      } else {
        this.editBody.userProfile.birthday = +inputBirthday;
        this.cue.birthday = '';
      }

    } else {
      const tempValue = inputBirthday + e.key,
            numReg = /\d+$/,
            monthReg = /[0][1-9]|[1][0-2]/,  // 01-12月
            dayReg = /[0][1-9]|[1-2][0-9]|[3][0-1]/,  // 01-31日
            bigMonthReg = /[0][13578]|[1][02]/,  // 大月
            smallMonthReg = /[0][469]|[1][1]/;  // 小月，2月另外判斷

      // 限制不符合日期格式的按鍵
      if (!numReg.test(e.key) || (inputBirthday.length === 0 && +e.key === 0)) {
        e.preventDefault();
      } else if (tempValue[3] && +tempValue.slice(0, 4) > currentYear - 12) {
        this.editBody.userProfile.birthday = currentYear - 12;
        this.errorDateFormat(e);
      } else if (tempValue[5] && !monthReg.test(tempValue.slice(4, 6))) {
        this.editBody.userProfile.birthday = tempValue.slice(0, 4);
        this.errorDateFormat(e);
      } else if (tempValue[7] && !dayReg.test(tempValue.slice(6, 8))) {
        this.editBody.userProfile.birthday = tempValue.slice(0, 6);
        this.errorDateFormat(e);
      } else if (bigMonthReg.test(tempValue.slice(4, 6)) && +tempValue.slice(6, 8) > 31) {
        this.editBody.userProfile.birthday = tempValue.slice(0, 6);
        this.errorDateFormat(e);
      } else if (smallMonthReg.test(tempValue.slice(4, 6)) && +tempValue.slice(6, 8) > 30) {
        this.editBody.userProfile.birthday = tempValue.slice(0, 6);
        this.errorDateFormat(e);
      } else if (tempValue.slice(4, 6) === '02' && +tempValue.slice(6, 8) > 28 && +tempValue.slice(0, 4) % 4 !== 0) {
        this.editBody.userProfile.birthday = tempValue.slice(0, 6);
        this.errorDateFormat(e);
      } else if (tempValue.slice(4, 6) === '02' && +tempValue.slice(6, 8) > 29 && +tempValue.slice(0, 4) % 4 === 0) {
        this.editBody.userProfile.birthday = tempValue.slice(0, 6);
        this.errorDateFormat(e);
      } else {
        this.cue.birthday = '';
      }

    }

  }

  // 不符合日期格式則取符合格式片段並給予提示-kidin-1090526
  errorDateFormat(e) {
    e.preventDefault();
    this.cue.birthday = 'universal_status_wrongFormat';
  }

  // 確認身高是否為異常值-kidin-1090525
  checkBodyHeight (e) {
    const height = e.currentTarget.value;
    if ((e.type === 'keypress' && e.key === 'Enter') || e.type === 'focusout') {

      if (height.length === 0) {
        this.editBody.userProfile.bodyHeight = 175;
      } else if (+height < 100) {
        this.editBody.userProfile.bodyHeight = 100;
        this.cue.bodyHeight = 'universal_status_wrongRange';
      } else if (+height > 255) {
        this.editBody.userProfile.bodyHeight = 255;
        this.cue.bodyHeight = 'universal_status_wrongRange';
      } else {
        this.editBody.userProfile.bodyHeight = +height;
        this.cue.bodyHeight = '';
      }

    } else {
      const numReg = /\d+$/;
      if (!numReg.test(e.key) || (height.length === 0 && +e.key === 0)) {
        e.preventDefault();
      }

    }

  }

  // 確認體重是否為異常值-kidin-1090525
  checkBodyWeight (e) {
    const weight = e.currentTarget.value;
    if ((e.type === 'keypress' && e.key === 'Enter') || e.type === 'focusout') {

      if (weight.length === 0) {
        this.editBody.userProfile.bodyWeight = 70;
      } else if (+weight < 40) {
        this.editBody.userProfile.bodyWeight = 40;
        this.cue.bodyWeight = 'universal_status_wrongRange';
      } else if (+weight > 255) {
        this.editBody.userProfile.bodyWeight = 255;
        this.cue.bodyWeight = 'universal_status_wrongRange';
      } else {
        this.editBody.userProfile.bodyWeight = +weight;
        this.cue.bodyWeight = '';
      }

    } else {
      const numReg = /\d+$/;
      if (!numReg.test(e.key) || (weight.length === 0 && +e.key === 0)) {
        e.preventDefault();
      }

    }

  }

  // 送出表單-kidin-1090526
  submit () {
    (this.editBody.userProfile.gender as any) = +this.editBody.userProfile.gender;

    const image = new Image();
    image.src = this.finalImageLink || '/assets/images/user2.png';
    this.editBody.userProfile.avatar.large = this.imageToDataUri(image, 256, 256);
    this.editBody.userProfile.avatar.mid = this.imageToDataUri(image, 128, 128);
    this.editBody.userProfile.avatar.small = this.imageToDataUri(image, 64, 64);

    this.signupService.fetchUpdateUserProfile(this.editBody).subscribe(res => {
      if (res.processResult.resultCode !== 200) {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: 'Server error.<br />Please try again later.',
            confirmText: this.translate.instant(
              'universal_operating_confirm'
            )
          }
        });

      } else {
        const msg = `${
          this.translate.instant('universal_operating_update')} ${
          this.translate.instant('universal_userProfile_info')} ${
          this.translate.instant('universal_status_success')}
        `;

        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          disableClose: true,
          data: {
            title: 'Message',
            body: msg,
            confirmText: this.translate.instant(
              'universal_operating_confirm'
            ),
            onConfirm: this.navigateToDashboard.bind(this)
          }
        });

      }

    });

  }

  // 將圖片轉為base64格式-kidin-1090526
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

  // 清除session flag並轉導至目標頁或dashboard-kidin-1090526
  navigateToDashboard () {
    this.utils.removeSessionStorageObject('isFirstLogin');
    if (this.authService.backUrl.length > 0) {
      return (location.href = this.authService.backUrl);
    } else {
      return (location.href = '/dashboard');
    }

  }

  // 離開頁面則取消隱藏navbar及取消rxjs訂閱-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

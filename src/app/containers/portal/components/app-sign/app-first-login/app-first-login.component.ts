import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../../core/services/auth.service';
import { Api10xxService } from '../../../../../core/services/api-10xx.service';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { UtilsService } from '../../../../../shared/services/utils.service';

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
    private api10xxService: Api10xxService
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
    this.editBody.token = this.authService.token;
    this.getUserInfo();

    // 在首次登入頁面按下登出時，跳轉回登入頁-kidin-1090109(bug575)
    this.authService.isLogin.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      if (!res && this.pcView === true) {
        return this.router.navigateByUrl('/signIn-web');
      } else if (!res && !this.pcView) {
        return this.router.navigateByUrl('/signIn');
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
    const currentYear = +dayjs().year();
    this.editBody.userProfile.birthday = +`${currentYear - 30}0101`;
  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo () {
    const body = { token: this.authService.token };
    this.api10xxService.fetchGetUserProfile(body).subscribe(res => {
      this.nickName = res.userProfile.nickname;
    });

  }

  /**
   * 使使用者無法輸入非數字
   * @param e {KeyBoardEvent}
   */
  lockUnNum(e: KeyboardEvent) {
    const numReg = /\d+$/;
    if (!numReg.test(e.key)) {
      e.preventDefault();
    }

  }

  // 確認生日是否為異常值-kidin-1090525
  checkBirthday (e) {
    this.cue.birthday = '';
    const inputBirthday = e.currentTarget.value;

    if (inputBirthday.length < 8) {
      this.editBody.userProfile.birthday = 19900101;
      this.errorDateFormat(e);
    } else {
      let year = inputBirthday.slice(0, 4),
          month = inputBirthday.slice(4, 6),
          day = inputBirthday.slice(6, 8);
      const monthReg = /[0][1-9]|[1][0-2]/,  // 01-12月
            dayReg = /[0][1-9]|[1-2][0-9]|[3][0-1]/,  // 01-31日
            bigMonthReg = /[0][13578]|[1][02]/,  // 大月
            smallMonthReg = /[0][469]|[1][1]/,  // 小月，2月另外判斷
            currentYear = +dayjs().year();

      // 先判斷年份是否合乎範圍值
      if (year < currentYear - 80) {
        year = currentYear - 80;
        this.errorDateFormat(e);
      } else if (year > currentYear - 12) {
        year = currentYear - 12;
        this.errorDateFormat(e);
      }

      // 再判斷月份是否合乎範圍值
      if (!monthReg.test(month)) {
        month = `01`;
        this.errorDateFormat(e);
      }

      // 最後判斷日是否合乎範圍值（包含大小月和閏年）
      if (!dayReg.test(day)) {
        day = `31`;
        this.errorDateFormat(e);
      } else if (smallMonthReg.test(month) && +day > 30) {
        day = `30`;
        this.errorDateFormat(e);
      } else if (month === '02' && +day > 28 && year % 4 !== 0) {
        day = `28`;
        this.errorDateFormat(e);
      } else if (month === '02' && +day > 29 && year % 4 === 0) {
        day = `29`;
        this.errorDateFormat(e);
      }

      this.editBody.userProfile.birthday = +`${year}${month}${day}`;
    }

  }

  // 不符合日期格式則取符合格式片段並給予提示-kidin-1090526
  errorDateFormat(e) {
    e.preventDefault();
    this.cue.birthday = 'universal_status_wrongRange';
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

    this.api10xxService.fetchEditUserProfile(this.editBody).subscribe(res => {
      if (res.processResult.resultCode !== 200) {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: 'Error.<br />Please try again later.',
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

  // 轉導至目標頁或dashboard-kidin-1090526
  navigateToDashboard () {
    if (this.authService.backUrl.length > 0) {
      return (location.href = this.authService.backUrl);
    } else {
      return (location.href = '/dashboard');
    }

  }

  // 離開頁面則取消隱藏navbar及取消rxjs訂閱-kidin-1090514
  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

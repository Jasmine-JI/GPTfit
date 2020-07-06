import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RandomCodeService } from '../../services/random-code.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { RandomCode } from '../../models/random-code';
import { ForgetService } from '../../services/forget.service';
import { SignupResponse } from '../../models/signup-response';
import { SignupService } from '../../services/signup.service';
import { SMSCode } from '../../models/sms-code';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-forgetpwd',
  templateUrl: './forgetpwd.component.html',
  styleUrls: ['./forgetpwd.component.css']
})
export class ForgetpwdComponent implements OnInit, OnDestroy {
  i18n = {
    email: '',
    phone: ''
  };
  form: FormGroup;
  results: any;
  isEmailMethod = false;
  placeholder = '輸入您的手機號碼';
  countryCode: string;
  randomCode: RandomCode;
  isCodeInvalid = false;
  smsVerifyCode: string;
  @ViewChild('f', {static: false}) forgetForm: any;
  isChartCodeErr = false;
  isSMSCodeErr = false;
  isForgetSending = false;
  isSMSCodSending = false;
  content = '送出';
  className = 'btn btn-primary access-btn';
  timeout: any;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackbar: MatSnackBar,
    private randomCodeService: RandomCodeService,
    private utils: UtilsService,
    private forgetService: ForgetService,
    private signupService: SignupService,
    private translate: TranslateService
  ) {
    translate.onLangChange.subscribe(() => {
      this.getTranslate();
    });

  }

  get phone() {
    return this.form.get('phone');
  }

  ngOnInit() {

    this.form = this.fb.group(
      {
        phone: ['', Validators.required],
        smsCode: ['', Validators.required]
      },
    );
  }

  public onPhoneChange(code): void {
    this.countryCode = code.slice(1, code.length);
    if (!this.countryCode) {
      this.isCodeInvalid = true;
    } else {
      this.isCodeInvalid = false;
    }
  }

  // 取得多國語系翻譯-kidin-1090620
  getTranslate () {
    this.translate.get('hollo word').subscribe(() => {
      this.i18n = {
        email: this.translate.instant('universal_userAccount_email'),
        phone: this.translate.instant('universal_userAccount_phone')
      };

    });

  }

  forget({ valid, value }) {
    if (!this.countryCode) {
      this.isCodeInvalid = true;
    } else {
      this.isCodeInvalid = false;
    }
    if (valid) {
      if (this.isEmailMethod) {
        if (this.randomCode.randomCodeVerify === value.chartCode) {
          this.isChartCodeErr = false;
          const body = {
            email: value.email,
            randomCode: value.chartCode
          };
          this.handleForget(body);
        } else {
          this.isChartCodeErr = true;
        }
      } else {
        if (this.smsVerifyCode === value.smsCode) {
          this.isSMSCodeErr = false;
          const param = {
            smsVerifyCode: value.smsCode,
            countryCode: this.countryCode,
            phone: this.phone.value
          };
          const resetPwdQuery = this.utils.buildUrlQueryStrings(param);
          this.router.navigateByUrl(`/resetpassword?${resetPwdQuery}`);
        } else {
          this.isSMSCodeErr = true;
        }
      }
    }
  }
  handleForget(body) {
    this.isForgetSending = true;
    this.forgetService.forgetPWD(body).subscribe(
      (res: SignupResponse) => {
        const {
          resultCode,
          info: { rtnMsg }
        } = res;
        if (resultCode === 200) {
          this.snackbar.open(
            this.translate.instant('universal_userAccount_sendRestPwdEmailSuccess'),
            'OK',
            { duration: 5000 }
          );
          this.timeout = setTimeout(() => this.router.navigate(['/signin']), 5000);
        } else if (rtnMsg === 'This is not a registered or activation mail.') {
          this.snackbar.open(this.translate.instant('universal_userAccount_noRegisterData'), 'OK', { duration: 5000 });
          this.isForgetSending = false;
        } else {
          this.snackbar.open(rtnMsg, 'OK', { duration: 5000 });
          this.isForgetSending = false;
        }
      }
    );
  }
  handleRandomCode() {
    this.randomCodeService.getRandomCode().subscribe((res: RandomCode) => {
      const { randomCodeVerify, randomCodeImg } = res;
      this.randomCode = {
        randomCodeImg: this.utils.buildBase64ImgString(randomCodeImg),
        randomCodeVerify
      };
    });
  }
  switchMethod(e) {
    e.preventDefault();
    this.isEmailMethod = !this.isEmailMethod;
    this.isCodeInvalid = false;
    if (this.isEmailMethod) {
      this.form = this.fb.group(
        {
          email: [
            '',
            [
              Validators.required,
              Validators.pattern(
                /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/
              )
            ]
          ],
          chartCode: ['', Validators.required]
        },
      );
      this.handleRandomCode();
    } else {
      this.form = this.fb.group(
        {
          phone: ['', Validators.required],
          smsCode: ['', Validators.required]
        },
      );
    }
    return this.forgetForm.resetForm();
  }
  sendSMSCode(e) {
    e.preventDefault();
    this.phone.markAsTouched();
    if (!this.countryCode) {
      this.isCodeInvalid = true;
    } else {
      this.isCodeInvalid = false;
    }
    if (
      this.countryCode &&
      this.phone.value &&
      this.phone.valid &&
      !this.isSMSCodSending
    ) {
      const categoryNum = '2';  // 帶上category使API驗證該手機號碼是否已註冊-kidin-1081108
      const body = { countryCode: this.countryCode, phone: this.phone.value, category: categoryNum };
      this.isSMSCodSending = true;
      this.signupService.getSMSVerifyCode(body).subscribe((res: SMSCode) => {
        this.isSMSCodSending = false;
        const {
          resultCode,
          smsVerifyCode,
          info: { rtnMsg }
        } = res;
        if (resultCode === 200) {
          this.smsVerifyCode = smsVerifyCode;
          this.snackbar.open(
            `${this.translate.instant('universal_userAccount_phoneCaptcha')} ${this.translate.instant('universal_operating_send')}`,
            'OK',
            { duration: 5000 }
          );
        } else if (rtnMsg === 'This is not a registered or activation account.') {
          this.snackbar.open(this.translate.instant('universal_userAccount_noRegisterData'), 'OK', { duration: 5000 });
        } else {
          this.snackbar.open(rtnMsg, 'OK', { duration: 5000 });
        }
      });
    }
  }

  ngOnDestroy() {
    if(this.timeout) {
      clearInterval(this.timeout);
    }
  }
}

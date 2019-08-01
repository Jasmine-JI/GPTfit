import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { RandomCodeService } from '../../services/random-code.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { RandomCode } from '../../models/random-code';
import { ForgetService } from '../../services/forget.service';
import { SignupResponse } from '../../models/signup-response';
import { SignupService } from '../../services/signup.service';
import { SMSCode } from '../../models/sms-code';
import { equalValueValidator } from '@shared/equal-value-validator';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-forgetpwd',
  templateUrl: './forgetpwd.component.html',
  styleUrls: ['./forgetpwd.component.css']
})
export class ForgetpwdComponent implements OnInit {
  form: FormGroup;
  results: any;
  isEmailMethod = false;
  placeholder = '輸入您的手機號碼';
  countryCode: string;
  randomCode: RandomCode;
  isCodeInvalid = false;
  smsVerifyCode: string;
  @ViewChild('f') forgetForm: any;
  isChartCodeErr = false;
  isSMSCodeErr = false;
  isPhoneNotSame = false;
  isEmailNotSame = false;
  isForgetSending = false;
  isSMSCodSending = false;
  content = '送出';
  className = 'btn btn-primary access-btn';
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackbar: MatSnackBar,
    private randomCodeService: RandomCodeService,
    private utils: UtilsService,
    private forgetService: ForgetService,
    private signupService: SignupService,
    private translate: TranslateService
  ) {}
  get phone() {
    return this.form.get('phone');
  }
  get confirmPhone() {
    return this.form.get('confirmPhone');
  }
  ngOnInit() {
    this.form = this.fb.group(
      {
        phone: ['', Validators.required],
        confirmPhone: ['', Validators.required],
        smsCode: ['', Validators.required]
      },
      {
        validator: equalValueValidator('phone', 'confirmPhone')
      }
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
  forget({ valid, value }) {
    if (!this.countryCode) {
      this.isCodeInvalid = true;
    } else {
      this.isCodeInvalid = false;
    }
    if (valid) {
      if (this.isEmailMethod) {
        if (value.confirmEmail === value.email) {
          this.isEmailNotSame = false;
        } else {
          this.isEmailNotSame = true;
        }
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
        if (value.confirmPhone === value.phone) {
          this.isPhoneNotSame = false;
        } else {
          this.isPhoneNotSame = true;
        }
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
            this.translate.instant('Portal.MailHadBeenSend'),
            'OK',
            { duration: 5000 }
          );
          setTimeout(() => this.router.navigate(['/signin']), 5000);
        } else {
          this.snackbar.open(rtnMsg, 'OK', { duration: 5000 });
          this.isForgetSending = false;
        }
      },
      () => (this.isForgetSending = false)
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
          confirmEmail: [
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
        {
          validator: equalValueValidator('email', 'confirmEmail')
        }
      );
      this.handleRandomCode();
    } else {
      this.form = this.fb.group(
        {
          phone: ['', Validators.required],
          confirmPhone: ['', Validators.required],
          smsCode: ['', Validators.required]
        },
        {
          validator: equalValueValidator('phone', 'confirmPhone')
        }
      );
    }
    return this.forgetForm.resetForm();
  }
  sendSMSCode(e) {
    e.preventDefault();
    this.phone.markAsTouched();
    this.confirmPhone.markAsTouched();
    if (!this.countryCode) {
      this.isCodeInvalid = true;
    } else {
      this.isCodeInvalid = false;
    }
    if (
      this.countryCode &&
      this.phone.value &&
      this.phone.valid &&
      this.confirmPhone.value &&
      this.confirmPhone.valid &&
      this.confirmPhone.value === this.phone.value &&
      !this.isSMSCodSending
    ) {
      const body = { countryCode: this.countryCode, phone: this.phone.value };
      this.isPhoneNotSame = false;
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
        }
        this.snackbar.open(rtnMsg, 'OK', { duration: 5000 });
      });
    } else {
      this.isPhoneNotSame = true;
    }
  }
}

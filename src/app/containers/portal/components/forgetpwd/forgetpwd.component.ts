import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { AuthService } from '@shared/services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { RandomCodeService } from '../../services/random-code.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { RandomCode } from '../../models/random-code';
import { ForgetService } from '../../services/forget.service';
import { SignupResponse } from '../../models/signup-response';
import { SignupService } from '../../services/signup.service';
import { SMSCode } from '../../models/sms-code';

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
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbar: MatSnackBar,
    private randomCodeService: RandomCodeService,
    private utils: UtilsService,
    private forgetService: ForgetService,
    private signupService: SignupService
  ) {}
  get phone() {
    return this.form.get('phone');
  }
  get confirmPhone() {
    return this.form.get('confirmPhone');
  }
  ngOnInit() {
    this.form = this.fb.group({
      phone: ['', Validators.required],
      confirmPhone: ['', Validators.required],
      smsCode: ['', Validators.required]
    });
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
        if (this.randomCode.randomCodeVerify === value.chartCode) {
          this.isChartCodeErr = false;
          const body = {
            name: value.name,
            email: value.email,
            phone: '',
            countryCode: '',
            smsVerifyCode: ''
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
          const resetPwdQuery =  this.utils.buildUrlQueryStrings(param);
          this.router.navigateByUrl(`/resetpassword?${resetPwdQuery}`);
        } else {
          this.isSMSCodeErr = true;
        }
      }
    }
  }
  handleForget(body) {
    this.forgetService.forgetPWD(body).subscribe((res: SignupResponse) => {
      const {
        resultCode,
        info: { rtnMsg }
      } = res;
      if (resultCode === 200) {
        this.snackbar.open('註冊成功，五秒後將跳轉回登入頁面', 'OK', {
          duration: 3000
        });
        setTimeout(() => this.router.navigate(['/signin']), 5000);
      } else {
        this.snackbar.open(rtnMsg, 'OK', { duration: 3000 });
      }
    });
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
      this.form.removeControl('smsCode');
      this.form.removeControl('phone');
      this.form.removeControl('confirmPhone');
      const emailControl: FormControl = new FormControl('', [
        Validators.required,
        Validators.pattern(
          /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/
        )
      ]);
      const confirmEmailControl: FormControl = new FormControl('', [
        Validators.required,
        Validators.pattern(
          /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/
        )
      ]);
      const chartCodeControl: FormControl = new FormControl(
        '',
        Validators.required
      );

      this.form.addControl('email', emailControl);
      this.form.addControl('confirmEmail', confirmEmailControl);
      this.form.addControl('chartCode', chartCodeControl);
      this.handleRandomCode();
    } else {
      this.form.removeControl('chartCode');
      this.form.removeControl('email');
      this.form.removeControl('confirmEmail');
      const phoneControl: FormControl = new FormControl(
        '',
        Validators.required
      );
      const confirmPhoneControl: FormControl = new FormControl(
        '',
        Validators.required
      );
      const smsControl: FormControl = new FormControl('', Validators.required);
      this.form.addControl('phone', phoneControl);
      this.form.addControl('confirmPhone', confirmPhoneControl);
      this.form.addControl('smsCode', smsControl);
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
      this.phone.value && this.phone.valid
      &&
      this.confirmPhone.value && this.confirmPhone.valid
      &&
      this.confirmPhone.value === this.phone.value
    ) {
      const body = { countryCode: this.countryCode, phone: this.phone.value };
      this.isPhoneNotSame = false;
      this.signupService.getSMSVerifyCode(body).subscribe((res: SMSCode) => {
        const {
          resultCode,
          smsVerifyCode,
          info: { rtnMsg }
        } = res;
        if (resultCode === 200) {
          this.smsVerifyCode = smsVerifyCode;
        }
        this.snackbar.open(rtnMsg, 'OK', { duration: 3000 });
      });
    } else {
      this.isPhoneNotSame = true;
    }
  }
}

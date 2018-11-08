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
import { SignupService } from '../../services/signup.service';
import { SMSCode } from '../../models/sms-code';
import { SignupResponse } from '../../models/signup-response';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  form: FormGroup;
  results: any;
  isEmailMethod = false;
  placeholder = '輸入您的手機號碼';
  countryCode: string;
  randomCode: RandomCode;
  isCodeInvalid = false;
  smsVerifyCode: string;
  @ViewChild('f') signupForm: any;
  isChartCodeErr = false;
  isSMSCodeErr = false;
  isSignupSending = false;
  isSMSCodSending = false;
  content = '註冊';
  className = 'btn btn-primary access-btn';
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbar: MatSnackBar,
    private randomCodeService: RandomCodeService,
    private utils: UtilsService,
    private signupService: SignupService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/)
        ]
      ],
      phone: ['', Validators.required],
      name: ['', Validators.required],
      smsCode: ['', Validators.required]
    });
  }
  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }
  get phone() {
    return this.form.get('phone');
  }
  public onCodeChange(code): void {
    this.countryCode = code.slice(1, code.length);
    if (!this.countryCode) {
      this.isCodeInvalid = true;
    } else {
      this.isCodeInvalid = false;
    }
  }
  public onNameChange(e: any): void {
    const charValue = this.utils.str_cut(e.target.value, 16);
    if (e.target.value !== charValue) {
      return this.form.patchValue({ name: charValue });
    }
  }
  signup({ valid, value }) {
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
            smsVerifyCode: '',
            password: value.password
          };
          this.handleSignup(body);
        } else {
          this.isChartCodeErr = true;
        }
      } else {
        if (this.smsVerifyCode === value.smsCode) {
          this.isSMSCodeErr = false;
          const body = {
            name: value.name,
            email: '',
            phone: value.phone,
            password: value.password,
            countryCode: this.countryCode,
            smsVerifyCode: value.smsCode
          };
          this.handleSignup(body);
        } else {
          this.isSMSCodeErr = true;
        }
      }
    }
  }
  handleSignup(body) {
    this.isSignupSending = true;
    this.signupService.register(body).subscribe((res: SignupResponse) => {
      const {
        resultCode,
        info: { rtnMsg }
      } = res;
      if (resultCode === 200) {
        let successText = '註冊成功，請至註冊信箱點擊完成E-mail驗證，五秒後將跳轉回登入頁面';
        if (body.phone.length > 0) {
          successText = '註冊成功，五秒後將跳轉回登入頁面';
        }
        this.snackbar.open(successText, 'OK', { duration: 5000 });
        setTimeout(() => this.router.navigate(['/signin']), 5000);
      } else {
        this.isSignupSending = false;
        this.snackbar.open(rtnMsg, 'OK', { duration: 5000 });
      }
    }, () => (this.isSignupSending = false));
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
      const emailControl: FormControl = new FormControl('', [
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
      this.form.addControl('chartCode', chartCodeControl);
      this.handleRandomCode();
    } else {
      this.form.removeControl('chartCode');
      this.form.removeControl('email');
      const phoneControl: FormControl = new FormControl(
        '',
        Validators.required
      );
      const smsControl: FormControl = new FormControl('', Validators.required);
      this.form.addControl('phone', phoneControl);
      this.form.addControl('smsCode', smsControl);
    }
    return this.signupForm.resetForm();
  }

  sendSMSCode(e) {
    e.preventDefault();
    this.phone.markAsTouched();
    if (!this.countryCode) {
      this.isCodeInvalid = true;
    } else {
      this.isCodeInvalid = false;
    }
    if (this.countryCode && this.phone.value && !this.isSMSCodSending) {
      const body = {
        countryCode: this.countryCode,
        phone: this.phone.value
      };
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
    }
  }
}

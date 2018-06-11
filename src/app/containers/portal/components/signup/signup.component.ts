import { Component, OnInit } from '@angular/core';
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
  counrtyCode: string;
  randomCode: RandomCode;
  isCodeInvalid = false;
  smsVerifyCode: string;
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
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/
          )
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/)
        ]
      ],
      phone: ['', Validators.required],
      name: ['', Validators.required],
      smsCode: ['', Validators.required],
      chartCode: ['', Validators.required]
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
  public onPhoneChange(code): void {
    this.counrtyCode = code.slice(1, code.length);
    if (!this.counrtyCode) {
      this.isCodeInvalid = true;
    } else {
      this.isCodeInvalid = false;
    }
    const phoneValue = this.form.get('phone').value;
  }
  public onNameChange(e: any, { controls: { name } }): void {
    const charValue = this.utils.str_cut(e.target.value, 16);
    if (e.target.value !== charValue) {
      return this.form.patchValue({ name: charValue });
    }
  }
  signup() {
    if (!this.counrtyCode) {
      this.isCodeInvalid = true;
    } else {
      this.isCodeInvalid = false;
    }
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
    if (this.isEmailMethod) {
      this.handleRandomCode();
    }
  }

  sendSMSCode(e) {
    e.preventDefault();
    if (this.counrtyCode && this.phone.value) {
      const body = {
        countryCode: this.counrtyCode,
        phone: this.phone.value
      };
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
    }
  }
}

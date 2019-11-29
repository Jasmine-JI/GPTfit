import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ResetPasswordService } from '../../services/reset-password.service';
import { getUrlQueryStrings } from '@shared/utils/';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit, OnDestroy {
  isSuccess = false;
  code: string;
  email: string;
  response: any;
  isConfirm = true;
  resultMessage = '';
  queryStrings: any;
  content = '送出';
  className = 'btn btn-primary access-btn';
  isSending = false;
  timeout: any;
  constructor(
    private resetPasswordService: ResetPasswordService,
    private router: Router
  ) { }
  resetpwd = {
    newPassword: '',
    confirmPassword: ''
  };
  ngOnInit() {
    this.queryStrings = getUrlQueryStrings(location.search);
    const { code, smsVerifyCode, countryCode, phone } = this.queryStrings;
    if (code) {
      this.resetPasswordService.getEmail(code).subscribe(res => {
        this.response = res;
        if (this.response === 'noemail') {
          return this.router.navigateByUrl('/404');
        }
        this.email = this.response.email;
      });
    } else if (smsVerifyCode && countryCode && phone) {
      this.email = phone;
    } else {
      this.router.navigateByUrl('/404');
    }
  }
  reset({ value, valid }) {
    const { newPassword, confirmPassword } = value;
    if (newPassword !== confirmPassword) {
      valid = false;
      return (this.isConfirm = false);
    }
    this.isConfirm = true;
    if (valid) {
      let email = this.email.toLowerCase();
      email = email.trim();
      const body = {
        email,
        password: newPassword,
        confirmpassword: confirmPassword,
        smsVerifyCode: '',
        countryCode: '',
        phone: ''
      };
      const { smsVerifyCode, countryCode, phone } = this.queryStrings;
      if (smsVerifyCode && countryCode && phone) {
        body.smsVerifyCode = smsVerifyCode;
        body.countryCode = countryCode;
        body.phone = phone;
      }
      this.isSending = true;
      this.resetPasswordService.resetPassword(body).subscribe(res => {
        this.isSending = false;
        this.response = res;

        const { resultCode, resultMessage } = this.response;
        if (resultCode === 200) {
          this.isSuccess = true;
          setTimeout(() => this.router.navigate(['/signin']), 5000);
        } else {
          this.resultMessage = resultMessage;
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

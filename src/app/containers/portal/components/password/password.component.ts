import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ResetPasswordService } from '../../services/reset-password.service';
import { getUrlQueryStrings } from '@shared/utils/';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit {
  isSuccess = false;
  code: string;
  email: string;
  response: any;
  isConfirm = true;
  resultMessage = '';
  queryStrings: any;
  constructor(
    private resetPasswordService: ResetPasswordService,
    private router: Router
  ) {}
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
      this.resetPasswordService.resetPassword(body).subscribe(res => {
        this.response = res;

        const { resultCode, resultMessage } = this.response;
        if (resultCode === 200) {
          this.isSuccess = true;
        } else {
          this.resultMessage = resultMessage;
        }
      });
    }
  }
}

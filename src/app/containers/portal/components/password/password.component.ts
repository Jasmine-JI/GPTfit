import { Component, OnInit } from '@angular/core';
import { ResetPasswordService } from '../../services/reset-password.service';
import { getUrlQueryStrings } from '@shared/utils/';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit {
  isSuccess = false;
  email: string;
  response: any;
  constructor(
    private resetPasswordService: ResetPasswordService
  ) { }
  resetpwd = {
    newPassword: '',
    confirmPassword: ''
  };
  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    this.email = queryStrings.email;
  }
  reset({value, valid}) {
    const {
      newPassword,
      confirmPassword
    } = value;
    if (newPassword !== confirmPassword) {
      valid = false;
    }
    if (valid) {
      const body = {
        email: this.email,
        password: newPassword,
        confirmpassword: confirmPassword
      };
      this.resetPasswordService.resetPassword(body).subscribe((res) => {
        this.response = res;
        let { resultCode } = this.response;
        if (resultCode = 200) {
          this.isSuccess = true;
        }
      });
    }

  }
}

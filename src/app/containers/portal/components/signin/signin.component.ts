import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { AuthService } from '@shared/services/auth.service';
import { setLocalStorageObject } from '@shared/utils';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  form: FormGroup;
  results: any;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      accountName: '',
      password: ''
    });
  }
  get accountName() {
    return this.form.get('accountName');
  }
  get password() {
    return this.form.get('password');
  }
  // get rememberMe() {
  //   return this.form.get('rememberMe');
  // }

  login() {
    const body = {
      email: this.accountName.value,
      password: this.password.value,
      // rememberMe: this.rememberMe.value,
      iconType: 2
    };

    this.authService.login(body).subscribe(res => {
      if (res) {
        this.snackbar.open('登入成功', 'OK', { duration: 3000 });
      } else {
        this.snackbar.open('請檢查使用者名稱及密碼', 'OK', { duration: 3000 });
      }
    });
  }
}

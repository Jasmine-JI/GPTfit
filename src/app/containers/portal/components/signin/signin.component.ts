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
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  form: FormGroup;
  results: any;
  content = '登入';
  className = 'btn btn-primary access-btn';
  isLogining = false;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      accountName: ['', Validators.required],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/)
        ]
      ]
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

  login({ valid }) {
    const body = {
      email: this.accountName.value,
      password: this.password.value,
      // rememberMe: this.rememberMe.value,
      iconType: 2
    };
    if (valid) {
      this.isLogining = true;
      this.authService.login(body).subscribe(res => {
        this.isLogining = false;
        if (res) {
          this.snackbar.open('登入成功', 'OK', { duration: 5000 });
        } else {
          this.snackbar.open('請檢查使用者名稱及密碼', 'OK', {
            duration: 5000
          });
        }
      });
    }
  }
  onConfirm() {
    this.router.navigateByUrl('/signup');
  }
  showPrivateMsg(e) {
    e.preventDefault();
    const text = '我已仔細閱讀並明瞭' +
    '<a target="_blank"href="https://www.alatech.com.tw/action-copyright.htm">『條款及條件』</a>' +
    '、<a target="_blank" href="https://www.alatech.com.tw/action-privacy.htm">『隱私權聲明』</a>'
    + '等所記載內容及其意義，茲同意該等條款規定，並願遵守網站現今，嗣後規範。';

    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: '同意條款',
        body: text.trim(),
        confirmText: '同意',
        cancelText: '不同意',
        onConfirm: this.onConfirm
      }
    });
  }
}

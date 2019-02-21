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
import { TranslateService } from '@ngx-translate/core';

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
  title: string;
  confirmText: string;
  cancelText: string;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });
    this.getAndInitTranslations();
  }

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
  getAndInitTranslations() {
    this.translate
      .get(['Portal.Agree-to-the-terms', 'SH.Agree', 'SH.Disagree'])
      .subscribe(translation => {
        this.title = translation['Portal.Agree-to-the-terms'];
        this.confirmText = translation['SH.Agree'];
        this.cancelText = translation['SH.Disagree'];
      });
  }
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
          this.snackbar.open(
            this.translate.instant('Portal.LoginSuccessfully'),
            'OK',
            { duration: 5000 }
          );
        } else {
          this.snackbar.open(
            this.translate.instant('Portal.PlzCheckNamePwd'),
            'OK',
            { duration: 5000 }
          );
        }
      });
    }
  }
  onConfirm() {
    this.router.navigateByUrl('/signup');
  }
  showPrivateMsg(e) {
    e.preventDefault();
    let text = '';
    if (this.translate.currentLang === 'zh-tw') {
      text = '我已仔細閱讀並明瞭' +
      '<a target="_blank"href="https://www.alatech.com.tw/action-copyright.htm">『條款及條件』</a>' +
      '、<a target="_blank" href="https://www.alatech.com.tw/action-privacy.htm">『隱私權聲明』</a>' +
      '等所記載內容及其意義，茲同意該等條款規定，並願遵守網站現今，嗣後規範。';
    } else if (this.translate.currentLang === 'zh-cn') {
      text = '我已仔细阅读并明了' +
        '<a target="_blank"href="https://www.alatech.com.tw/action-copyright.htm">『条款及条件』</a>' +
        '、<a target="_blank" href="https://www.alatech.com.tw/action-privacy.htm">『隐私权声明』</a>' +
        '等所记载内容及其意义，兹同意该等条款规定，并愿遵守网站现今，嗣后规范。 ';
    } else {
      text = 'I have read and understood ' +
        '<a target="_blank"href="https://www.alatech.com.tw/action-copyright.htm">"Terms and Conditions"</a>' +
        ', <a target="_blank" href="https://www.alatech.com.tw/action-privacy.htm">"Privacy Policy"</a>' +
        'Where the contents and their meanings are agreed, I agree to the terms and conditions, ' +
        'and I am willing to abide by the current and future standards of the website. ';
    }


    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: this.title,
        body: text.trim(),
        confirmText: this.confirmText,
        cancelText: this.cancelText,
        onConfirm: this.onConfirm
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { AuthService } from '@shared/services/auth.service';
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
      .get(['Portal.clause', 'SH.agree', 'SH.disagree'])
      .subscribe(translation => {
        this.title = translation['Portal.clause'];
        this.confirmText = translation['SH.agree'];
        this.cancelText = translation['SH.disagree'];
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
            this.translate.instant('Portal.signSuceesfully'),
            'OK',
            { duration: 5000 }
          );
        } else {
          this.snackbar.open(
            this.translate.instant('Portal.notSameAccount'),
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
    text = `${this.translate.instant('Portal.clauseContentPage1')}
    <a target="_blank"href="https://www.alatech.com.tw/action-copyright.htm">『${this.translate.instant('Portal.clause')}』</a>
    、 <a target="_blank" href="https://www.alatech.com.tw/action-privacy.htm">『${this.translate.instant('Portal.privacyStatement')}』</a>
    ${this.translate.instant('Portal.clauseContentPage2')}`.replace(/\n/gm, '');

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

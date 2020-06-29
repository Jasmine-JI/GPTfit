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
  i18n = {
    account: '',
    password: ''
  };
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
      .get([
        'universal_userAccount_clause',
        'universal_operating_agree',
        'universal_operating_disagree',
        'universal_userAccount_account',
        'universal_userAccount_password'
      ])
      .subscribe(translation => {
        this.title = translation['universal_userAccount_clause'];
        this.confirmText = translation['universal_operating_agree'];
        this.cancelText = translation['universal_operating_disagree'];

        this.i18n.account = translation['universal_userAccount_account'];
        this.i18n.password = translation['universal_userAccount_password'];
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
            this.translate.instant('universal_userAccount_signSuceesfully'),
            'OK',
            { duration: 5000 }
          );
        } else {
          this.snackbar.open(
            this.translate.instant('universal_userAccount_notSameAccount'),
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
    text = `${this.translate.instant('universal_userAccount_clauseContentPage1')}
    <a target="_blank"href="https://www.alatech.com.tw/action-copyright.htm">『${this.translate.instant('universal_userAccount_clause')}』</a>
    、 <a target="_blank" href="https://www.alatech.com.tw/action-privacy.htm">『${this.translate.instant('universal_userAccount_privacyStatement')}』</a>
    ${this.translate.instant('universal_userAccount_clauseContentPage2')}`.replace(/\n/gm, '');

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

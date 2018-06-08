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
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbar: MatSnackBar,
    private randomCodeService: RandomCodeService,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      accountName: '',
      password: '',
      phone: ['', Validators.required]
    });
  }
  get accountName() {
    return this.form.get('accountName');
  }
  get password() {
    return this.form.get('password');
  }
  get phone() {
    return this.form.get('phone');
  }
  public onPhoneChange(code): void {
    this.counrtyCode = code;
    const phoneValue = this.form.get('phone').value;
  }
  login() {}
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
}

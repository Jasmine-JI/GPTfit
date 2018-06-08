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

@Component({
  selector: 'app-forgetpwd',
  templateUrl: './forgetpwd.component.html',
  styleUrls: ['./forgetpwd.component.css']
})
export class ForgetpwdComponent implements OnInit {
  form: FormGroup;
  results: any;
  isEmailMethod = false;
  placeholder = '輸入您的手機號碼';
  counrtyCode: string;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbar: MatSnackBar
  ) { }

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
  login() {
  }
  switchMethod(e) {
    e.preventDefault();
    this.isEmailMethod = !this.isEmailMethod;
  }
}

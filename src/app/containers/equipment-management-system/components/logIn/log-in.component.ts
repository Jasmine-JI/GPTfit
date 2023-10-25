import { UserProfile } from './../../../../core/models/api/api-10xx/api-10xx-common.model';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, filter, map, takeUntil } from 'rxjs';
import {
  UserService,
  AuthService,
  ApiCommonService,
  HintDialogService,
} from '../../../../core/services';
import { SignInType } from '../../../../core/enums/personal';
import { getLocalStorageObject, setLocalStorageObject } from '../../../../core/utils';
import { formTest } from '../../../../core/models/regex/form-test';
import { AccessRight, KeyCode } from '../../../../core/enums/common';
import { TranslateModule } from '@ngx-translate/core';
import { codes, errorMessage } from '../../../../core/models/const';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  equipmentManagementNoPermission,
  equipmentManagementSearch,
} from '../../equipment-management-routing.module';

type AlertType = 'empty' | 'format' | 'mistake' | 'repeat' | 'improper' | 'overdue' | 'notExist';
type AuthInput = 'accountInput' | 'passwordInput' | 'nicknameInput' | 'smsInput';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss'],
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf, NgFor, MatIconModule, FormsModule, TranslateModule],
})
export class LogInComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @ViewChild('accountInput') accountInput: ElementRef;
  @ViewChild('passwordInput') passwordInput: ElementRef;

  uiFlag = {
    isMobile: false,
    showCountryCodeList: false,
    progress: 100,
    showNicknameHint: false,
    showPassword: false,
    focusInput: false,
    clickSubmit: false,
    fixFooter: false,
    showStationMailList: false,
    haveNewMail: false,
  };

  userInfo: UserProfile;
  token = this.auth.token;

  authInfo = <any>{
    signInType: <SignInType | null>null,
    password: null,
  };

  /**
   * 登入/註冊/忘記密碼等欄位提示
   */
  authAlert = {
    account: <AlertType>null,
    password: <AlertType>null,
    nickname: <AlertType>null,
    qrLogin: <AlertType>null,
    sms: <AlertType>null,
    captcha: <AlertType>null,
  };

  readonly SignTypeEnum = SignInType;
  readonly countryCodeList = codes;

  constructor(
    private userService: UserService,
    private auth: AuthService,
    private apiCommonService: ApiCommonService,
    private hintDialogService: HintDialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkIfLogin();
    // this.getUserProfile();
  }

  checkIfLogin() {
    if (this.token) {
      // this.getUserProfile();
      this.checkIfAccessRight();
    } else {
      // console.log('未登入');
    }
  }

  checkIfAccessRight() {
    // console.log('已登入，判斷是否有權限');
    const accessRight = this.userService.getUser().systemAccessright;
    if (accessRight <= AccessRight.marketing) {
      // console.log('權限<=29');
      location.replace(equipmentManagementSearch);
      // this.router.navigateByUrl(equipmentManagementSearch);
    } else {
      // console.log('無權限,權限:', this.userService.getUser().systemAccessright);
      location.replace(equipmentManagementSearch);
      // this.router.navigateByUrl(equipmentManagementNoPermission);
    }
  }

  /**
   * 顯示完整密碼與否
   * @author kidin-1101203
   */
  showPassword() {
    this.uiFlag.showPassword = !this.uiFlag.showPassword;
  }

  /**
   * 送出表單
   * @author kidin-1101203
   */
  submit() {
    const alertElement = document.querySelector('[data-pass=false]');
    const checkEmptyPass = this.checkAuthInfo();
    const passCheck = !alertElement && checkEmptyPass;
    const { account: accountAlert } = this.authAlert;
    if (passCheck || accountAlert === 'mistake') this.login();
  }

  /**
   * 確認表單是否含空值
   */
  checkAuthInfo() {
    const { authInfo } = this;
    const havePhone = authInfo.countryCode && authInfo.mobileNumber ? true : false;
    const haveEmail = authInfo.email ? true : false;
    const havePassword = authInfo.password ? true : false;
    return (havePhone || haveEmail) && havePassword;
  }

  /**
   * 登入
   */
  login() {
    this.auth.accountLogin(this.authInfo).subscribe((result) => {
      const loginResult = result;
      if (this.apiCommonService.checkRes(loginResult, false)) {
        this.handleLoginSuccess(loginResult.signIn.token);
      } else {
        this.handleLoginError(loginResult);
      }
    });
  }

  /**
   * 處理登入成功後續流程
   * @param token {any}-登入權杖
   */
  handleLoginSuccess(token: any) {
    this.token = token;
    this.auth.setToken(token);
    this.auth.tokenLogin();
    // console.log('輸入登入成功');
    this.checkIfAccessRight();
  }

  /**
   * 處理登入失敗
   * @param error {any}-api v2-1003 result
   */
  handleLoginError(error: any) {
    const { processResult } = error;
    if (processResult) {
      const { apiReturnCode } = processResult;
      const accountPasswordError = [2096, 2097, 2098];
      if (accountPasswordError.includes(apiReturnCode)) {
        this.authAlert.account = 'mistake';
        // console.log('mistake');
      } else {
        this.hintDialogService.showSnackBar(errorMessage);
      }
    } else {
      this.hintDialogService.showSnackBar(errorMessage);
    }
  }

  /**
   * 確認帳號類別
   * @param e {KeyboardEvent}
   */
  checkAccountType(e: KeyboardEvent) {
    const { value } = (e as any).target;
    if (this.checkEnter(e, 'accountInput')) {
      return;
    } else if (!value) {
      this.authInfo.signInType = null;
      delete this.authInfo.countryCode;
    } else if (formTest.number.test(value)) {
      this.authInfo.signInType = SignInType.phone;
      const countryCode = this.getCountryCode();
      Object.assign(this.authInfo, { countryCode });
    } else {
      this.authInfo.signInType = SignInType.email;
      delete this.authInfo.countryCode;
    }
  }

  /**
   * 確認是否按下enter鍵
   * @param e {KeyboardEvent}
   * @param currentInput {AuthInput}
   */
  checkEnter(e: KeyboardEvent, currentInput: AuthInput) {
    const { keyCode } = e as any;
    const isEnter = keyCode === KeyCode.enter;
    if (isEnter) {
      this.handleNextStep(currentInput);
      return true;
    } else {
      return false;
    }
  }

  /**
   * 當使用者按下enter時，進行下一步
   * @param input {AuthInput}-目前所在欄位
   */

  handleNextStep(input: AuthInput) {
    const totalInput = <Array<AuthInput>>['accountInput', 'passwordInput', 'nicknameInput'];
    const inputOrder: Array<AuthInput> = ['accountInput', 'passwordInput'];

    const finalStep = inputOrder.length - 1;
    const currentStep = inputOrder.indexOf(input);

    if (currentStep === finalStep) {
      this[input].nativeElement.blur();
      this.submit();
    } else {
      const nextStep = currentStep + 1;
      const nextFocusInput = totalInput[nextStep];
      this[nextFocusInput].nativeElement.focus();
    }
  }

  /**
   * 從localstorage取得已儲存之countryCode，若無則預設886
   */
  getCountryCode() {
    const countryCode = getLocalStorageObject('countryCode');
    return countryCode ? countryCode : 886;
  }

  /**
   * 確認帳號是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1101203
   */
  checkAccountFormat(e: MouseEvent) {
    const value = (e as any).target.value.trim();
    const { signInType } = this.authInfo;
    if (signInType === SignInType.phone) {
      this.checkPhoneFormat(+value); // 藉由轉數字將開頭所有0去除
    } else if (signInType === SignInType.email) {
      this.checkEmailFormat(value);
    } else {
      this.authAlert.account = 'empty';
    }
  }

  /**
   * 顯示國碼選擇清單
   * @param e {MouseEvent}
   */
  showCountryCodeList(e: MouseEvent) {
    e.stopPropagation();
    const { showCountryCodeList } = this.uiFlag;
    if (showCountryCodeList) {
      this.uiFlag.showCountryCodeList = false;
    } else {
      this.uiFlag.showCountryCodeList = true;
    }
  }

  /**
   * 選擇國碼
   * @param e {MouseEvent}
   * @param code {string}-所選國碼
   */
  selectCountryCode(e: MouseEvent, code: string) {
    e.stopPropagation();
    const newCountryCode = code.split('+')[1];
    const { countryCode: oldCountryCode } = this.authInfo;
    if (newCountryCode !== oldCountryCode) {
      this.authInfo.countryCode = newCountryCode;
      setLocalStorageObject('countryCode', newCountryCode);
    }
    this.uiFlag.showCountryCodeList = false;
  }

  /**
   * 確認電話號碼是否符合格式
   * @param newPhone {number}-新編輯之手機號碼
   * @author kidin-1101108
   */
  checkPhoneFormat(newPhoneNumber: number) {
    const newPhone = `${newPhoneNumber}`;
    if (newPhone.length === 0) {
      this.authAlert.account = 'empty';
    } else if (!formTest.phone.test(newPhone)) {
      this.authAlert.account = 'format';
    } else {
      this.authAlert.account = null;
      this.authInfo.mobileNumber = newPhoneNumber;
    }
  }

  /**
   * 確認電子信箱是否符合格式
   * @param newEmail {string}-新編輯之email
   * @author kidin-1101108
   */
  checkEmailFormat(newEmail: string) {
    if (newEmail.length === 0) {
      this.authAlert.account = 'empty';
    } else if (!formTest.email.test(newEmail)) {
      this.authAlert.account = 'format';
    } else {
      this.authAlert.account = null;
      this.authInfo.email = newEmail;
    }
  }

  /**
   * 確認密碼是否有值
   * @param e {MouseEvent}
   * @author kidin-1101111
   */
  checkPassword(e: MouseEvent) {
    this.uiFlag.focusInput = false;
    const password = (e as any).target.value;
    if (password.length === 0) {
      this.authAlert.password = 'empty';
    } else if (!formTest.password.test(password)) {
      this.authAlert.password = 'format';
    } else {
      this.authAlert.password = null;
      this.authInfo.password = password;
    }
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

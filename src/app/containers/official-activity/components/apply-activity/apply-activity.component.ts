import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OfficialActivityService } from '../../services/official-activity.service';
import { formTest } from '../../../../shared/models/form-test';
import { fromEvent, Subject, Subscription, merge, of, combineLatest } from 'rxjs';
import { takeUntil, switchMap, map, tap } from 'rxjs/operators';
import { UtilsService } from '../../../../shared/services/utils.service';
import { codes } from '../../../../shared/models/countryCode';
import { Sex } from '../../../../shared/models/user-profile-info';
import { nicknameDefaultList } from '../../../../shared/models/nickname-list';
import { SelectDate } from '../../../../shared/models/utils-type';
import { SignTypeEnum } from '../../../../shared/models/utils-type';
import moment from 'moment';
import { AuthService } from '../../../../shared/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { UserProfileInfo, AccountTypeEnum, AccountStatusEnum } from '../../../../shared/models/user-profile-info';
import { GetClientIpService } from '../../../../shared/services/get-client-ip.service';
import { Nationality, ApplyStatus, EventStatus } from '../../models/activity-content';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { SignupService } from '../../../../shared/services/signup.service';
import { AlaApp } from '../../../../shared/models/app-id';
import { EnableAccountFlow } from '../../../../shared/models/signup-response';
import { LockCaptcha } from '../../../../shared/classes/lock-captcha';
import { checkResponse } from '../../../../shared/utils/index';


const stageHeight = 90;
type InputAlert = 'format' | 'empty' | 'repeat' | 'login';
interface NewRegister {
  token: string;
  password: string;
};


@Component({
  selector: 'app-apply-activity',
  templateUrl: './apply-activity.component.html',
  styleUrls: ['./apply-activity.component.scss']
})
export class ApplyActivityComponent implements OnInit, AfterViewInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private resizeEvent: Subscription;
  private clickScrollEvent: Subscription;

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    progress: 100,
    showLoginButton: <AccountTypeEnum>null,
    showAside: true,
    haveAccount: false,
    accountChecking: <AccountTypeEnum>null,
    showCountryCodeList: false,
    showNicknameHint: false,
    showEmergencyContact: false,
    showGroupList: false,
    currentFocusInput: '#phone',
    applyComplish: false,
    enableAccount: false,
    smsError: false,
    enableAccomplishment: false,
    showPasswordHint: false,
    newPasswordFormatError: false,
    newPasswordUpdated: false,
    newAccount: false,
    clickSubmitButton: false,
    isApplied: false,
    notQualified: false,
    displayPW: false
  };

  eventInfo: any;
  eventDetail: any;

  /**
   * 表單完成階段的提示
   */
  stageTop = {
    start: 0,
    edit: 0,
    final: 0
  };

  /**
   * 表單階段提示間的連線位置與長度
   */
  progressLine = {
    start: {
      top: 0,
      height: 0
    },
    finished: {
      top: 0,
      height: 0
    },
    edit: {
      top: 0,
      height: 0
    },

  };

  applyInfo = {
    targetEventId: null,
    targetGroupId: 1,
    targetFeeId: 1,
    userProfile: {
      countryCode: codes[0].code.split('+')[1],
      mobileNumber: null,
      email: null,
      nickname: this.createNickname(),
      taiwaness: <Nationality>Nationality.taiwaness,
      idCardNumber: null,
      address: null,
      birthday: null,
      gender: Sex.male,
      truthName: null,
      emergencyContact: {
        name: null,
        mobileNumber: null,
        relationship: null
      },
      remark: null
    }
     
  };

  alert = {
    mobileNumber: <InputAlert>null,
    email: <InputAlert>null,
    nickname: <InputAlert>null,
    idCardNumber: <InputAlert>null,
    address: <InputAlert>null,
    gender: <InputAlert>null,
    truthName: <InputAlert>null,
    emergencyContact: {
      name: <InputAlert>null,
      mobileNumber: <InputAlert>null,
      relationship: <InputAlert>null
    }

  };

  /**
   * 登入request
   */
  loginBody = <any>{
    signInType: <SignTypeEnum>SignTypeEnum.phone,
    password: null
  };

  /**
   * 啟用request
   */
  enableBody = <any>{
    enableAccountFlow: EnableAccountFlow.request,
    project: AlaApp.gptfit
  };

  /**
   * 編輯密碼request
   */
  editAccountBody = {
    editType: 1,
    token: null,
    oldPassword: null,
    newPassword: null
  }

  /**
   * 紀錄所選方案組合
   */
  selectPlanInfo = {
    feeId: null,
    title: null,
    fee: null
  }

  imgLock: LockCaptcha;
  groupList = [];  // 使用者可選擇之分組類別
  defaultBirthday = moment().subtract(40, 'year').startOf('year'); 
  token = this.utils.getToken();
  userId: number;
  intervals: NodeJS.Timeout;
  timeCount = 30;
  readonly SignTypeEnum = SignTypeEnum;
  readonly AccountTypeEnum = AccountTypeEnum;
  readonly countryCodeList = codes;
  readonly Nationality = Nationality;
  readonly Sex = Sex;
  readonly limitMinBirth = moment().subtract(100, 'year').startOf('year');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private officialActivityService: OfficialActivityService,
    private utils: UtilsService,
    private auth: AuthService,
    private snackbar: MatSnackBar,
    private userProfileService: UserProfileService,
    private getClientIp: GetClientIpService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private signupService: SignupService
  ) { }

  ngOnInit(): void {
    this.checkEventId();
    if (this.token) this.checkApplied();
    this.checkScreenSize();
    this.subscribeResizeEvent();
  }

  ngAfterViewInit() {
    this.checkStagePosition();
  }

  /**
   * 偵測瀏覽器是否改變大小
   * @author kidin-1101108
   */
  subscribeResizeEvent() {
    const page = fromEvent(window, 'resize');
    this.resizeEvent = page.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.checkScreenSize();
    });

  }

  /**
   * 確認螢幕大小以決定是否顯示aside與progress
   * @author kidin-1101108
   */
  checkScreenSize() {
    const { innerWidth } = window;
    this.uiFlag.showAside = innerWidth > 767;
    this.checkStagePosition();
  }

  /**
   * 確認使用者是否已經報名
   * @author kidin-1101119
   */
  checkApplied() {
    const { token, applyInfo: { targetEventId: eventId } } = this;
    const body = {
      token,
      search: {
        userApplyInfo: {
          args: { eventId },
          target: ['eventId', 'applyStatus']
        }
      }
    };

    this.userProfileService.getAssignInfo(body).subscribe(res => {
      if (this.utils.checkRes(res)) {
        const { applyStatus } = res.result[0] ?? { applyStatus: ApplyStatus.notYet };
        if (applyStatus !== ApplyStatus.notYet) {
          this.navigateMyActivityPage();
        } else {
          this.getEventUserProfile(this.token);
        }
        
      }
      
    });
    
  }

  /**
   * 導至我的活動頁面
   * @author kidin-1101229
   */
  navigateMyActivityPage() {
    this.router.navigateByUrl('/official-activity/my-activity');
  }

  /**
   * 取得使用者最近一次之報名資訊與userProfile
   * @param token {string}-權杖
   * @author kidin-1101111
   */
  getEventUserProfile(token: string) {
    combineLatest([
      this.officialActivityService.getEventUserProfile({token}),
      this.userProfileService.getUserProfile({ token })
    ]).pipe(
      tap(result => {
        const [eventUserProfileResult, userProfileResult] = result;
        if (this.utils.checkRes(eventUserProfileResult)) {
          const { userProfile: eventUserProfile } = eventUserProfileResult;
          this.handleEventUserProfile(eventUserProfile);
        }

        if (this.utils.checkRes(userProfileResult)) {
          const { signIn: { accountStatus, accountType }, userProfile } = userProfileResult;
          this.loginBody.signInType = accountType;
          this.uiFlag.enableAccount = accountStatus === AccountStatusEnum.enabled;
          this.handleUserProfile(userProfile);
        }

      })
    ).subscribe();

  }

  /**
   * 將使用者過去報名資訊整理過後填入表單
   * @param eventUserProfile {any}-過去報名資訊
   * @author kidin-1101116
   */
  handleEventUserProfile(eventUserProfile: any) {
    for (let _key in this.applyInfo.userProfile) {
      const value = eventUserProfile[_key];
      if (value !== null && value !== undefined) {
        this.applyInfo.userProfile[_key] = value;
      }

    }

    this.defaultBirthday = moment(eventUserProfile.birthday, 'YYYYMMDD');
    this.initAlert();
    this.uiFlag.showLoginButton = null;
  }

  /**
   * 將使用者部份資訊填入表單(覆蓋eventUserProfile以避免資訊並非最新的)
   * @param userProfile {UserProfileInfo}-使用者資訊
   * @author kidin-1101116
   */
  handleUserProfile(userProfile: UserProfileInfo) {
    const {
      nickname,
      email,
      birthday,
      gender,
      countryCode,
      mobileNumber,
      userId
    } = userProfile;

    this.applyInfo.userProfile.nickname = nickname;
    this.applyInfo.userProfile.gender = gender;
    this.applyInfo.userProfile.birthday = +birthday;
    this.defaultBirthday = moment(birthday, 'YYYYMMDD');
    this.userId = userId;
    if (email) this.applyInfo.userProfile.email = email;
    if (countryCode) {
      this.applyInfo.userProfile.countryCode = `${countryCode}`;
      this.applyInfo.userProfile.mobileNumber = mobileNumber;
    }

    this.initAlert();
  }

  /**
   * 確認event id是否符合數字格式，並取得該活動資訊
   * @author kidin-1101104
   */
  checkEventId() {
    const eventId = +this.route.snapshot.paramMap.get('eventId');
    if (formTest.number.test(`${eventId}`)) {
      this.applyInfo.targetEventId = eventId;
      this.getEventDetail(eventId);
    } else {
      this.navigate404();
    }

  }

  /**
   * 轉導至404頁面
   * @author kidin-1101104
   */
  navigate404() {
    this.router.navigateByUrl('/official-activity/404');
  }

  /**
   * 取得活動詳細資訊
   * @param eventId {number}-活動流水id
   * @author kidin-1101104
   */
  getEventDetail(eventId: number) {
    this.officialActivityService.getEventDetail({eventId}).subscribe(res => {
      if (checkResponse(res)) {
        const { eventInfo, eventDetail } = res;
        const { eventStatus } = eventInfo;
        const { applyDate: { startDate, endDate } } = eventInfo;
        const overApplyDate = this.checkApplyDateOver(startDate, endDate);
        const canApply = !overApplyDate && eventStatus === EventStatus.audit;
        if (canApply) {
          this.eventInfo = eventInfo;
          this.eventDetail = eventDetail;
          this.filterGroupList();
          this.handleDefaultApplyFee(eventDetail);
          return true;
        }

      } 

      return this.navigate404();
    });

  }

  /**
   * 預設使用者選擇第一個付費方案
   * @param eventDetail {any}-活動詳細資訊
   * @author kidin-1101116
   */
  handleDefaultApplyFee(eventDetail: any) {
    const { feeId, title, fee } = eventDetail.applyFee[0];
    this.selectPlanInfo = {
      feeId,
      title,
      fee
    };

  }

  /**
   * 確認現在時間是否符合報名日期
   * @author kidin-1101104
   */
  checkApplyDateOver(startTimestamp: number, endTimestamp: number) {
    const now = this.utils.getCurrentTimestamp('ms');
    const currentTimestamp = Math.round(now / 1000);
    const beforeStart = currentTimestamp < startTimestamp;
    const afterEnd = currentTimestamp > endTimestamp;
    return beforeStart || afterEnd;
  }

  /**
   * 隨機產生暱稱，並檢查是否重複
   * @author kidin-1101110
   */
  createNickname() {
    const id = this.createRandomId();
    const name = this.createRandomName();
    const randomNickname = `${name}${id}`;
    this.checkNickname(randomNickname);
    return `${name}${id}`;
  }

  /**
   * 使用millisecond timestamp最後四位數當id
   * @author kidin-1101110
   */
  createRandomId() {
    const timestamp = `${this.utils.getCurrentTimestamp('ms')}`;
    const timestampLength = timestamp.length;
    return timestamp.slice(timestampLength - 4, timestampLength);
  }

  /**
   * 使用random函式隨機選出名稱
   * @author kidin-1101110
   */
  createRandomName() {
    const randomRange = nicknameDefaultList.length - 1;
    const lottery = Math.round(Math.random() * randomRange);
    return nicknameDefaultList[lottery];
  }

  /**
   * 確認進度提示之顯示位置
   * @author kidin-1101104
   */
  checkStagePosition() {
    // 使用setTimeout處理ExpressionChangedAfterItHasBeenCheckedError報錯
    setTimeout(() => {
      const { showAside, currentFocusInput } = this.uiFlag;
      if (showAside) {
        const stageHalfHeight = stageHeight / 2;
        const phoneInputElement = document.getElementById('phone');
        const focusInputElement = document.querySelector(currentFocusInput);
        const submitElement = document.querySelector('.submit__button');
        const originElement = document.querySelector('.apply__stage');
        if (phoneInputElement && submitElement && originElement) {
          const phoneInputTop = phoneInputElement.getBoundingClientRect().top - stageHalfHeight;
          const focusInputTop = focusInputElement.getBoundingClientRect().top - stageHalfHeight;
          const submitTop = submitElement.getBoundingClientRect().top;
          const originTop = originElement.getBoundingClientRect().top;
          this.stageTop = {
            start: phoneInputTop - originTop,
            edit: focusInputTop - originTop,
            final: submitTop - originTop
          };

          this.checkProgressPosition()
        }

      }

    });

  }

  /**
   * 確認進度提示階段間線段之顯示位置與長度
   * @author kidin-1101104
   */
  checkProgressPosition() {
    const { start, edit, final } = this.stageTop;
    const originElement = document.querySelector('.apply__stage');
    if (originElement) {
      const originElementInfo = originElement.getBoundingClientRect();
      const originElementTop = originElementInfo.top;
      const originElementBottom = originElementInfo.bottom;
      const startBottom = start + stageHeight;
      const editBottom = edit + stageHeight;
      this.progressLine = {
        start: {
          top: originElementBottom - originElementTop,
          height: start - (originElementBottom - originElementTop)
        },
        finished: {
          top: startBottom,
          height: edit - startBottom < 0 ? 0 : edit - startBottom
        },
        edit: {
          top: editBottom,
          height: final - editBottom
        }

      };

    }

  }

  /**
   * 根據缺漏（或聚焦）的項目，移動"編輯中"的區塊至該位置
   * @param e {MouseEvent}
   * @author kidin-1101110
   */
  positionMark(e: MouseEvent) {
    const { showAside, applyComplish } = this.uiFlag;
    if (showAside && !applyComplish) {
      const firstAlertElement = document.querySelector('.alert__text');
      if (firstAlertElement) {
        this.uiFlag.currentFocusInput = '.alert__text';
      } else {
        const targetId = (e as any).currentTarget.id;
        this.uiFlag.currentFocusInput = `#${targetId}`;
      }

      this.checkStagePosition();
    }

  }

  /**
   * 顯示國碼選擇清單
   * @param e {MouseEvent}
   * @author kidin-1101108
   */
  showCountryCodeList(e: MouseEvent) {
    e.stopPropagation();
    const { token, loginBody: { signInType } } = this;
    if (!token || signInType !== SignTypeEnum.phone) {
      const { showCountryCodeList } = this.uiFlag;
      if (showCountryCodeList) {
        this.unsubscribeClickScrollEvent();
      } else {
        this.uiFlag.showCountryCodeList = true;
        this.positionMark(e);
        this.subscribeClickScrollEvent();
      }

    }
    
  }

  /**
   * 訂閱點擊與滾動事件
   * @author kidin-1101108
   */
  subscribeClickScrollEvent() {
    const { showAside } = this.uiFlag;
    const targetClass = showAside ? '#main__content' : '.main__page';
    const targetElement = document.querySelector(targetClass);
    const clickEvent = fromEvent(document, 'click');
    const scrollEvent = fromEvent(targetElement, 'scroll');
    this.clickScrollEvent = merge(clickEvent, scrollEvent).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.unsubscribeClickScrollEvent();
    });

  }

  /**
   * 取消訂閱全域點擊與滾動事件
   * @author kidin-1101108
   */
  unsubscribeClickScrollEvent() {
    this.uiFlag.showCountryCodeList = false;
    this.uiFlag.showGroupList = false;
    if (this.clickScrollEvent) this.clickScrollEvent.unsubscribe();
  }
  
  /**
   * 選擇國碼
   * @param e {MouseEvent}
   * @param code {string}-所選國碼
   * @author kidin-1101108
   */
  selectCountryCode(e: MouseEvent, code: string) {
    e.stopPropagation();
    const newCountryCode = code.split('+')[1];
    const { countryCode: oldCountryCode } = this.applyInfo.userProfile;
    if (newCountryCode !== oldCountryCode) {
      this.applyInfo.userProfile.countryCode = newCountryCode;
      this.checkPhoneAccount();
    }
    
    this.unsubscribeClickScrollEvent();
  }

  /**
   * 確認電話號碼是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1101108
   */
  checkPhoneFormat(e: MouseEvent) {
    const trimValue = (e as any).target.value.trim();
    if (!trimValue) {
      this.alert.mobileNumber = 'empty';
      const { showLoginButton } = this.uiFlag;
      if (showLoginButton === AccountTypeEnum.phone) this.uiFlag.showLoginButton = null;
    } else {
      const newPhone = `${+trimValue}`;  // 藉由轉數字將開頭所有0去除
      if (!formTest.phone.test(newPhone)) {
        this.alert.mobileNumber = 'format';
      } else {
        this.alert.mobileNumber = null;
        this.applyInfo.userProfile.mobileNumber = +newPhone;
        this.checkPhoneAccount();
      }

    }

  }

  /**
   * 確認緊急聯絡人電話號碼是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1110119
   */
  checkEmergencyPhoneFormat(e: MouseEvent) {
    const trimValue = (e as any).target.value.trim();
    const newPhone = `${+trimValue}`;  // 藉由轉數字將開頭所有0去除
    if (trimValue.length !== 0 && !formTest.phone.test(newPhone)) {
      this.alert.emergencyContact.mobileNumber = 'format';
    } else {
      this.alert.emergencyContact.mobileNumber = null;
      this.applyInfo.userProfile.emergencyContact.mobileNumber = +newPhone || '';
      this.checkPhoneAccount();
    }

  }

  /**
   * 確認電話號碼是否已註冊
   * @author kidin-1101108
   */
  checkPhoneAccount() {
    const { mobileNumber, countryCode } = this.applyInfo.userProfile;
    if (!this.token && mobileNumber && countryCode) {
      const args = { countryCode, phone: mobileNumber };
      const target = ['phone'];
      this.checkRepeat(args, target).subscribe(res => {
        if (checkResponse(res)) {
          const { phone } = res.result[0] ?? {};
          if (phone) {
            delete this.loginBody.email;  // 避免多帳號者更換帳號
            this.loginBody.signInType = SignTypeEnum.phone;
            this.loginBody.countryCode = countryCode;
            this.loginBody.mobileNumber = mobileNumber;
            this.handleLoginButton(AccountTypeEnum.phone);
          } else {
            const { showLoginButton } = this.uiFlag;
            if (showLoginButton === AccountTypeEnum.phone) this.uiFlag.showLoginButton = null;
          }

        }

      });

    }

  }

  /**
   * 確認電子信箱是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1101108
   */
  checkEmailFormat(e: MouseEvent) {
    const newEmail = (e as any).target.value.trim();
    if (!newEmail) {
      this.alert.email = 'empty';
      const { showLoginButton } = this.uiFlag;
      if (showLoginButton === AccountTypeEnum.email) this.uiFlag.showLoginButton = null;
    } else {

      if (!formTest.email.test(newEmail)) {
        this.alert.email = 'format';
      } else {
        this.alert.email = null;
        this.applyInfo.userProfile.email = newEmail;
        this.checkEmailAccount(newEmail);
      }

    }

  }

  /**
   * 確認電子信箱是否已註冊
   * @param email {string}-電子郵件
   * @author kidin-1101108
   */
  checkEmailAccount(email: string) {
    const args = { email };
    const target = ['email'];
    if (!this.token) {
      this.checkRepeat(args, target).subscribe(res => {
        if (checkResponse(res)) {
          const { email } = res.result[0] ?? {};
          if (email) {
            delete this.loginBody.countryCode;  // 避免多帳號者更換帳號
            delete this.loginBody.mobileNumber;
            this.loginBody.signInType = SignTypeEnum.email;
            this.loginBody.email = email;
            this.handleLoginButton(AccountTypeEnum.email);
          } else {
            const { showLoginButton } = this.uiFlag;
            if (showLoginButton === AccountTypeEnum.email) this.uiFlag.showLoginButton = null;
          }

        }

      });

    }

  }

  /**
   * 顯示暱稱輸入提示
   * @param e {MouseEvent}
   * @author kidin-1101109
   */
  showNickNameHint(e: MouseEvent) {
    this.uiFlag.showNicknameHint = true;
    this.alert.nickname = null;
    this.positionMark(e);
  }

  /**
   * 確認暱稱是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1101109
   */
  checkNicknameFormat(e: MouseEvent) {
    this.uiFlag.showNicknameHint = false;
    const nickname = (e as any).target.value.trim();
    if (nickname.length === 0) {
      this.alert.nickname = 'empty';
    } else if (!formTest.nickname.test(nickname)) {
      this.alert.nickname = 'format';
    } else {
      this.alert.nickname = null;
      this.applyInfo.userProfile.nickname = nickname;
      this.checkNickname(nickname);
    }

  }

  /**
   * 確認密碼是否有值
   * @param e {MouseEvent}
   * @author kidin-1101111
   */
  checkPassword(e: MouseEvent) {
    const password = (e as any).target.value;
    this.loginBody.password = password;
  }

  /**
   * 登入
   * @author kidin-1101111
   */
  login() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      this.uiFlag.progress = 30;
      this.auth.loginServerV2(this.loginBody, false).pipe(
        switchMap(loginResponse => {
          if (checkResponse(loginResponse)) {
            const { signIn: { token, accountStatus } } = loginResponse;
            this.uiFlag.enableAccount = accountStatus === AccountStatusEnum.enabled;
            this.handleLoginSuccess(token);
            const args = { eventId: this.applyInfo.targetEventId };
            const target = ['eventId'];
            return this.checkRepeat(args, target, token, 'userApplyInfo').pipe(
              tap(checkApplyResponse => this.checkApply(checkApplyResponse))
            );
          } else {
            const msg = 'Login failed.';
            this.snackbar.open(msg, 'OK', { duration: 3000 } );
            return of(loginResponse);
          }

        })
      ).subscribe(res => {
        this.uiFlag.progress = 100;
      });

    }

  }

  /**
   * 登入成功
   * @param token {string}-登入權杖
   * @author kidin-1101229
   */
  handleLoginSuccess(token: string) {
    this.token = token;
    this.utils.writeToken(token);
    this.tokenLogin(token);
    this.uiFlag.showLoginButton = null;
    this.getEventUserProfile(token);
    const msg = 'Login success.';
    this.snackbar.open(msg, 'OK', { duration: 3000 } );
  }

  /**
   * 確認是否已經報名
   * @param response {any}-確認是否重複報名之api response
   * @author kidin-1101229
   */
  checkApply(response: any) {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      const { eventId: appliedEventId } = response.result[0] || { eventId: null };
      if (appliedEventId) {
        this.uiFlag.isApplied = true;
        const backUrl = `/official-activity/activity-detail/${appliedEventId}`;
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: `已報名此賽事`,
            confirmText: this.translate.instant('universal_operating_confirm'),
            onConfirm: () => this.router.navigateByUrl(backUrl)
          }
        });

      }

    })

  }

  /**
   * 確認暱稱是否重複
   * @param nickname {string}-暱稱
   * @author kidin-1101109
   */
  checkNickname(nickname: string) {
    const args = { nickname };
    const target = ['nickname'];
    if (!this.token) {
      this.checkRepeat(args, target).subscribe(res => {
        if (this.utils.checkRes(res)) {
          const { nickname } = res.result[0] ?? {};
          this.alert.nickname = nickname ? 'repeat' : null;
        }

      });

    }

  }

  /**
   * 確認真實姓名是否有值
   * @param e {MouseEvent}
   * @author kidin-1101110
   */
  checkTruthNameFormat(e: MouseEvent) {
    const truthName = (e as any).target.value.trim();
    if (truthName.length === 0) {
      this.alert.truthName = 'empty';
    } else {
      this.alert.truthName = null;
      this.applyInfo.userProfile.truthName = truthName;
    }

  }

  /**
   * 確認證件號碼是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1101110
   */
  checkIdCardNumberFormat(e: MouseEvent) {
    const idCardNumber = (e as any).target.value.trim();
    const { taiwaness } = this.applyInfo.userProfile;
    const isTaiwaness = taiwaness === Nationality.taiwaness;
    const newIdCardNumberFormat = formTest.newIdCardNumber.test(idCardNumber);
    const oldIdCardNumberFormat = !isTaiwaness && formTest.oldIdCardNumber.test(idCardNumber);
    if (idCardNumber.length === 0) {
      this.alert.idCardNumber = 'empty';
    } else if (!newIdCardNumberFormat && !oldIdCardNumberFormat) {
      this.alert.idCardNumber = 'format';
    } else {
      this.alert.idCardNumber = null;
      this.applyInfo.userProfile.idCardNumber = idCardNumber;
    }

  }

  /**
   * 取得使用者所選日期
   * @param date {SelectDate}-使用者所選日期
   * @author kidin-1101111
   */
  getSelectDate(date: SelectDate) {
    const { startDate } = date;
    const birthday = +moment(startDate).format('YYYYMMDD');
    this.applyInfo.userProfile.birthday = birthday;
    this.filterGroupList();
  }

  /**
   * 確認地址是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1101110
   */
  checkIdAddressFormat(e: MouseEvent) {
    const address = (e as any).target.value.trim();
    if (address.length === 0) {
      this.alert.address = 'empty';
    } else if (address.length < 10) {  // 地址至少10字以上
      this.alert.address = 'format';
    } else {
      this.alert.address = null;
      this.applyInfo.userProfile.address = address;
    }

  }

  /**
   * 顯示完整緊急聯絡人欄位
   * @param e {MouseEvent}
   * @author kidin-1101110
   */
  showEmergencyContact(e: MouseEvent) {
    this.uiFlag.showEmergencyContact = true;
    setTimeout(() => {
      this.positionMark(e);
    }, 300);

  }

  /**
   * 顯示分組清單
   * @param e {MouseEvent}
   * @author kidin-1101110
   */
  showGroupList(e: MouseEvent) {
    e.stopPropagation();
    const { showGroupList } = this.uiFlag;
    if (showGroupList) {
      this.unsubscribeClickScrollEvent();
    } else {
      this.uiFlag.showGroupList = true;
      this.positionMark(e);
      this.subscribeClickScrollEvent();
    }
    
  }

  /**
   * 選擇分組
   * @param e {MouseEvent}
   * @param groupId {number}-分組id
   * @author kidin-1101110
   */
  selectGroup(e: MouseEvent, groupId: number) {
    e.stopPropagation();
    this.applyInfo.targetGroupId = groupId;
    this.unsubscribeClickScrollEvent();
  }

  /**
   * 選擇報名費組合
   * @param feeId {number}-報名費組合id
   * @param title {string}-報名費組合標題
   * @param fee {number}-報名費費用
   * @author kidin-1101110
   */
  selectApplyFee(feeId: number, title: string, fee: number) {
    this.applyInfo.targetFeeId = feeId;
    this.selectPlanInfo = {
      feeId,
      title,
      fee
    };

  }

  /**
   * 檢查報名表單
   * @author kidin-1101111
   */
  checkForm() {
    this.uiFlag.clickSubmitButton = true;
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      // 透過先更新ui，以獲取尚未填寫之欄位
      setTimeout(() => {
        const errorInput = document.querySelectorAll('.alert__text');
        if (errorInput.length > 0) {
          const targetElement = errorInput[0] as HTMLElement;
          const targetPosition = targetElement.offsetTop;
          window.scrollTo({top: targetPosition, behavior: 'smooth'});
        } else {

          const { targetGroupId } = this.applyInfo;
          const { name } = this.eventDetail.group[targetGroupId - 1];
          const { title, fee } = this.selectPlanInfo;
          const checkI18n = this.translate.instant('universal_vocabulary_infoConfirm');
          const applyGroupI18n = this.translate.instant('universal_vocabulary_raceCatagory');
          const feeNameI18n = this.translate.instant('universal_vocabulary_racePackage');
          const feeI18n = this.translate.instant('universal_vocabulary_raceFee');
          const unEditableI18n = this.translate.instant('universal_vocabulary_noChangeAfterSign');

          const msg = `${checkI18n}<br><br>${applyGroupI18n}: ${
            name}<br>${feeNameI18n}: ${
            title}<br>${feeI18n}: $${
            fee}<br><br>${unEditableI18n}
          `;
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'Message',
              body: msg,
              cancelText: this.translate.instant('universal_operating_cancel'),
              onCancel: () => false,
              confirmText: this.translate.instant('universal_operating_confirm'),
              onConfirm: () => this.applyActivity()
            }

          });
          
        }

      });

    });

  }

  /**
   * 報名賽事
   * @author kidin-1101111
   */
  applyActivity() {
    const { uiFlag: { progress, isApplied, enableAccount }, token } = this;
    if (!isApplied && progress === 100) {
      this.uiFlag.progress = 30;

      if (token) Object.assign(this.applyInfo, { token });

      this.officialActivityService.applyEvent(this.applyInfo).subscribe(res => {
        this.uiFlag.progress = 100;
        if (this.utils.checkRes(res)) {
          const { register } = res;
          if (!token) {
            this.handleNewAccount(register);
          } else if (!enableAccount) {
            this.getVerification();
          }

          this.uiFlag.applyComplish = true;
        }

      });

    }

  }

  /**
   * 幫新使用者登入並紀錄random密碼
   * @param register {NewRegister}-新帳號之token與密碼
   * @author kidin-1101116
   */
  handleNewAccount(register: NewRegister) {
    const { token, password } = register;
    this.uiFlag.newAccount = true;
    this.editAccountBody.token = token;
    this.editAccountBody.oldPassword = password;
    this.token = token;
    this.utils.writeToken(token);
    this.tokenLogin(token);
  }

  /**
   * 使用token進行登入
   * @param token {string}-權杖
   * @author kidin-1101116
   */
  tokenLogin(token: string) {
    const body = {
      signInType: SignTypeEnum.token,
      token
    };

    this.auth.loginServerV2(body).subscribe(res => {
      if (checkResponse(res)) {
        const {
          signIn: { accountStatus, accountType },
          userProfile: { userId }
        } = res;

        this.userId = userId;
        this.uiFlag.enableAccount = accountStatus === AccountStatusEnum.enabled;
        this.getVerification();
      }

    });

  }

  /**
   * 根據確認指定資訊是否重複
   * @param args {any}-查詢條件
   * @param target {Array<string>}-欲取得之目標資訊
   * @author kidin-1101112
   */
  checkRepeat(
    args: any,
    target: Array<string>,
    token: string = null,
    tableName: string = 'userInfo'
  ) {
    const body = {
      search: {
        [tableName]: {
          args,
          target
        }
      }
    };

    if (token) Object.assign(body, { token });
    return this.userProfileService.getAssignInfo(body);
  }

  /**
   * 根據是否已經登入與是否有帳號顯示登入按鈕
   * @param type {AccountTypeEnum}-帳號類別
   * @author kidin-1101115
   */
  handleLoginButton(type: AccountTypeEnum) {
    this.uiFlag.showLoginButton = this.token ? null : type;
  }

  /**
   * 顯示密碼提示
   * @author kidin-1101116
   */
  showPasswordHint() {
    this.uiFlag.showPasswordHint = true;
  }

  /**
   * 確認密碼是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1101116
   */
  checkPasswordFormat(e: MouseEvent) {
    const { value } = (e as any).target;
    if (value.length === 0) {
      this.uiFlag.showPasswordHint = false;
      this.editAccountBody.newPassword = null;
    } else if (!formTest.password.test(value)) {
      this.uiFlag.newPasswordFormatError = true;
    } else {
      this.uiFlag.newPasswordFormatError = false;
      this.editAccountBody.newPassword = value;
    }

  }

  /**
   * 更新密碼
   * @author kidin-1101116
   */
  handleUpdatePassword() {
    const {
      uiFlag: { progress, newPasswordFormatError, newPasswordUpdated },
      editAccountBody: { newPassword }
    } = this;

    if (
      !newPasswordFormatError
      && !newPasswordUpdated
      && newPassword
      && progress === 100
    ) {
      this.uiFlag.progress = 30;
      this.getClientIp.requestIpAddress().pipe(
        switchMap(ipResult => {
          const header = { ip: (ipResult as any).ip };
          return this.signupService.fetchEditAccountInfo(this.editAccountBody, header).pipe(
            map(editResult => editResult)
          )
        })
      ).subscribe(res => {
        if (this.utils.checkRes(res)) {
          const { newToken } = res.editAccount;
          this.token = newToken;
          this.utils.writeToken(newToken);
          this.uiFlag.newPasswordUpdated = true;
          const msg = 'Update success.';
          this.snackbar.open(msg, 'OK', { duration: 3000 } );
        } else {
          const msg = 'Update failed.';
          this.snackbar.open(msg, 'OK', { duration: 3000 } );
        }

        this.uiFlag.progress = 100;
      });

    }

  }

  /**
   * 成立訂單並前往綠界繳費頁面
   * @author kidin-1101116
   */
  navigatePaidPage() {
    const {
      token,
      applyInfo: { targetEventId: eventId },
      selectPlanInfo: { feeId, title: productName, fee }
    } = this;
    const body = {
      token,
      eventId,
      feeId,
      productName,
      totalAmount: fee
    };

    this.officialActivityService.createProductOrder(body).subscribe(res => {
      if (checkResponse(res)) {
        const { responseHtml } = res;
        const newElement = document.createElement('div');
        const target = document.querySelector('.main__page');
        newElement.innerHTML = responseHtml as any;
        target.appendChild(newElement);
        (document.getElementById('data_set') as any).submit();
      }
      
    });

  }

  /**
   * 變更年齡
   * @param e {MouseEvent}
   * @author kidin-1101222
   */
  changeGender(e: MouseEvent) {
    const { value } = (e as any).target;
    this.applyInfo.userProfile.gender = +value;
    this.filterGroupList();
  }

  /**
   * 根據使用者之年齡與性別，篩選使用者可選擇之分組清單
   * @author kidin-1101222
   */
  filterGroupList() {
    if (this.eventDetail) {
      const { gender, birthday } = this.applyInfo.userProfile;
      const momentBirthday = birthday ? moment(birthday, 'YYYYMMDD') : this.defaultBirthday;
      const age = moment().diff(momentBirthday, 'year');
      this.groupList = this.eventDetail.group.filter(_list => {
        const { gender: groupGender, age: groupAge } = _list;
        const { max, min } = groupAge || { max: 100, min: 0 };
        const fitGender = groupGender === Sex.unlimit || gender === groupGender;
        const fitAge = !groupAge || (age >= min && age <= max);
        return fitGender && fitAge;
      });

      if (this.groupList.length > 0) {
        this.applyInfo.targetGroupId = this.groupList[0].id;
        this.uiFlag.notQualified = false;
      } else {
        this.showGroupAlert();
        this.uiFlag.notQualified = true;
      }

    }
    
  }

  /**
   * 若該年齡性別無分組，則跳出提示
   * @author kidin-1110104
   */
  showGroupAlert() {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      const msg = this.translate.instant('universal_vocabulary_notQualifiedWarning');
      this.utils.openAlert(msg);
    })
    
  }

  /**
   * 顯示密碼與否
   * @author kidin-111117
   */
  toggleDisplayPW() {
    this.uiFlag.displayPW = !this.uiFlag.displayPW;
  }

  /**
   * 將alert初始化
   * @author kidin-1110119
   */
  initAlert() {
    this.alert = {
      mobileNumber: null,
      email: null,
      nickname: null,
      idCardNumber: null,
      address: null,
      gender: null,
      truthName: null,
      emergencyContact: {
        name: null,
        mobileNumber: null,
        relationship: null
      }

    };
  }

  /**
   * 根據帳號類別取得驗證信/驗證簡訊
   * @author kidin-1110214
   */
  getVerification() {
    const { uiFlag: { progress }, timeCount, imgLock } = this;
    this.enableBody.enableAccountFlow = EnableAccountFlow.request;
    if (progress === 100) {
      
      if (imgLock) {
        this.handleCaptchaUnlock(this.getVerification.bind(this));
      } else if (timeCount === 30) {
        this.uiFlag.progress = 30;
        const { token, loginBody: { signInType } } = this;
        let enableBody = { ...this.enableBody, token };
        let msgKey = 'universal_userAccount_sendSmsSuccess';

        if (signInType === SignTypeEnum.email) {
          enableBody = { ...enableBody, redirectUrl: 'event' };
          msgKey = 'universal_userAccount_sendCaptchaChackEmail';
        }

        this.getClientIp.requestIpAddress().pipe(
          switchMap((ipResult: any) => {
            const header = { remoteAddr: ipResult.ip };
            return this.signupService.fetchEnableAccount(enableBody, header);
          })
        ).subscribe((res: any) => {
          if (!checkResponse(res)) {
            const { processResult } = res;
            if (processResult) {
              const { apiReturnMessage } = processResult;
              switch (apiReturnMessage) {
                case 'Found attack, update status to lock!':
                case 'Found lock!':
                  const { imgLockCode } = processResult;
                  this.imgLock = new LockCaptcha(imgLockCode, this.signupService, this.getClientIp);
                  break;
              }

            }
                
          } else {
            const msg = this.translate.instant(msgKey);
            this.utils.showSnackBar(msg);
            this.enableBody.enableAccountFlow = EnableAccountFlow.verify;
            if (signInType === SignTypeEnum.phone) this.reciprocal();
          }

          this.uiFlag.progress = 100;
        });

      }

    }

  }

  /**
   * 倒數計時避免濫用認證簡訊
   * @author kidin-1101206
   */
  reciprocal() {
    this.intervals = setInterval(() => {
      this.timeCount--;
      if (this.timeCount === 0) {
        this.timeCount = 30;
        window.clearInterval(this.intervals);
      }

    }, 1000);

  }

  /**
   * 驗證簡訊碼
   * @author kidin-1110214
   */
  handleEnableAccount() {
    const { uiFlag: { progress }, imgLock } = this;
    if (progress === 100) {

      if (imgLock) {
        this.handleCaptchaUnlock(this.handleEnableAccount.bind(this));
      } else {
        this.enableBody = { ...this.enableBody, userId: this.userId };
        this.getClientIp.requestIpAddress().pipe(
          switchMap((ipResult: any) => {
            const header = { remoteAddr: ipResult.ip };
            return this.signupService.fetchEnableAccount(this.enableBody, header);
          })
        ).subscribe((res: any) => {
          if (!checkResponse(res)) {
            this.uiFlag.smsError = true;
          } else {
            this.uiFlag.enableAccount = true;
            this.uiFlag.enableAccomplishment = true;
          }

        })

      }

    }

  }

  /**
   * 解瑣圖碼
   * @param callback {any}-callback function
   * @author kidin-1101206
   */
  handleCaptchaUnlock(callback: Function = null) {
    this.imgLock.requestUnlock().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(isUnlock => {
      if (isUnlock) {
        this.imgLock = undefined;
        callback();
      }

    });
    
  }

  /**
   * 解除rxjs訂閱及定時器
   */
  ngOnDestroy() {
    if (this.intervals) window.clearInterval(this.intervals);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
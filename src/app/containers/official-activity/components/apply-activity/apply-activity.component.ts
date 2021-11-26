import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OfficialActivityService } from '../../services/official-activity.service';
import { formTest } from '../../../../shared/models/form-test';
import { fromEvent, Subject, Subscription, merge, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { UtilsService } from '../../../../shared/services/utils.service';
import { codes } from '../../../../shared/models/countryCode';
import { Sex } from '../../../dashboard/models/userProfileInfo';
import { nicknameDefaultList } from '../../../../shared/models/nickname-list';
import { SelectDate } from '../../../../shared/models/utils-type';
import { SignTypeEnum } from '../../../../shared/models/utils-type';
import moment from 'moment';
import { AuthService } from '../../../../shared/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpParams } from '@angular/common/http';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { UserProfileInfo } from '../../../dashboard/models/userProfileInfo';
import { UserInfoService } from '../../../dashboard/services/userInfo.service';
import { GetClientIpService } from '../../../../shared/services/get-client-ip.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Nationality } from '../../models/activity-content';

const stageHeight = 90;
type AccountType = 'phone' | 'email';
type InputAlert = 'format' | 'empty' | 'repeat';
interface NewRegister {
  token: string;
  password: string;
};

enum SearchTypeEnum {
  nickname = 1,
  account
}

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
    showLoginButton: false,
    showAside: true,
    haveAccount: false,
    accountChecking: <AccountType>null,
    showCountryCodeList: false,
    showNicknameHint: false,
    showEmergencyContact: false,
    showGroupList: false,
    currentFocusInput: '#phone',
    applyComplish: false,
    loginLoading: false,
    applyLoading: false,
    showPasswordHint: false,
    newPasswordFormatError: false,
    upDatePasswordLoading: false,
    newPasswordUpdated: false,
    newAccount: false
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

  loginBody = <any>{
    signInType: <SignTypeEnum>SignTypeEnum.phone,
    password: null
  };

  editAccountBody = {
    editType: 1,
    token: null,
    oldPassword: null,
    newPassword: null
  }

  selectPlanInfo = {
    feeId: null,
    title: null,
    fee: null
  }

  defaultBirthday = moment().subtract(40, 'year').startOf('year'); 
  token = this.utils.getToken();
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
    private userInfoService: UserInfoService,
    private getClientIp: GetClientIpService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.checkEventId();
    if (this.token) this.checkApplied();
    this.subscribeResizeEvent();
    this.checkScreenSize();
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
          target: ['eventId']
        }
      }
    };

    this.userProfileService.getAssignInfo(body).subscribe(res => {
      if (this.utils.checkRes(res)) {
        const { result: { eventId: appliedEventId } } = res;
        if (appliedEventId) {
          this.router.navigateByUrl('/official-activity/my-activity');
        } else {
          this.getEventUserProfile(this.token);
        }
        
      }
      
    });
    
  }

  /**
   * 取得使用者最近一次之報名資訊
   * @param token {string}-權杖
   * @author kidin-1101111
   */
  getEventUserProfile(token: string) {
    this.officialActivityService.getEventUserProfile({token}).pipe(
      switchMap(eventUserProfile => {
        if (this.utils.checkRes(eventUserProfile)) {
          const { userProfile } = eventUserProfile;
          const notEmptyProfile = !this.utils.isObjectEmpty(userProfile);
          if (notEmptyProfile) {
            this.handleEventUserProfile(userProfile);
            return eventUserProfile;
          } else {
            return this.userProfileService.getUserProfile({token}).pipe(
              map(profileResult => {
                if (this.utils.checkRes(profileResult)) {
                  const { userProfile } = profileResult;
                  this.handleRxUserProfile(userProfile);
                  return of(userProfile);
                } else {
                  return of();
                }
                
                
              })
            );

          }

        } else {
          return eventUserProfile;
        }

      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe();

  }

  /**
   * 將使用者過去報名資訊整理過後填入表單
   * @param eventUserProfile {any}-過去報名資訊
   * @author kidin-1101116
   */
  handleEventUserProfile(eventUserProfile: any) {
    this.applyInfo.userProfile = eventUserProfile;
    delete this.applyInfo.userProfile['userId'];
    const { birthday } = this.applyInfo.userProfile;
    this.defaultBirthday = moment(birthday, 'YYYYMMDD');
    this.uiFlag.showLoginButton = false;
  }

  /**
   * 將使用者部份資訊填入表單
   * @param userRxProfile {UserProfileInfo}-使用者資訊
   * @author kidin-1101116
   */
  handleRxUserProfile(userRxProfile: UserProfileInfo) {
console.log('handleRxUserProfile', userRxProfile);
    const {
      nickname,
      email,
      birthday,
      gender,
      countryCode,
      mobileNumber
    } = userRxProfile;

    this.applyInfo.userProfile.nickname = nickname;
    this.applyInfo.userProfile.email = email ? email : null;
    this.applyInfo.userProfile.countryCode = countryCode ? `${countryCode}` : '886';
    this.applyInfo.userProfile.mobileNumber = mobileNumber ? mobileNumber : null;
    this.applyInfo.userProfile.gender = gender;
    this.applyInfo.userProfile.birthday = +birthday;
    this.defaultBirthday = moment(birthday, 'YYYYMMDD');
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
console.log('event detail', res);
      if (this.utils.checkRes(res)) {
        const { eventInfo, eventDetail } = res;
        const { applyDate: { startDate, endDate } } = eventInfo;
        const overApplyDate = this.checkApplyDateOver(startDate, endDate);
        if (overApplyDate) {
          this.navigate404();
        } else {
          this.eventInfo = eventInfo;
          this.eventDetail = eventDetail;
          this.handleDefaultApplyFee(eventDetail);
        }

      } else {
        this.navigate404();
      }

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
    const now = (new Date).getTime();
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
    const timestamp = `${(new Date).getTime()}`;
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

        this.checkProgressPosition();
      }

    }

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
        const targetId = (e as any).target.id;
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
    const { showCountryCodeList } = this.uiFlag;
    if (showCountryCodeList) {
      this.unsubscribeClickScrollEvent();
    } else {
      this.uiFlag.showCountryCodeList = true;
      this.positionMark(e);
      this.subscribeClickScrollEvent();
    }
    
  }

  /**
   * 訂閱點擊與滾動事件
   * @author kidin-1101108
   */
  subscribeClickScrollEvent() {
    const { showAside } = this.uiFlag;
    const targetClass = showAside ? '#main__content' : '#main__page';
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
    const { mobileNumber: oldPhone } = this.applyInfo.userProfile;
    const newPhone = `${+trimValue}`;  // 藉由轉數字將開頭所有0去除
    if (+newPhone !== oldPhone) {

      if (newPhone.length === 0) {
        this.alert.mobileNumber = 'empty';
      } else if (!formTest.phone.test(newPhone)) {
        this.alert.mobileNumber = 'format';
      } else {
        this.alert.mobileNumber = null;
        this.applyInfo.userProfile.mobileNumber = +newPhone;
        this.checkPhoneAccount();
      }

    }

  }

  /**
   * 確認電話號碼是否已註冊
   * @author kidin-1101108
   */
  checkPhoneAccount() {
    const { mobileNumber, countryCode } = this.applyInfo.userProfile;
    if (mobileNumber && countryCode) {
      const args = { countryCode, phone: mobileNumber };
      const target = ['phone'];
      this.checkRepeat(args, target).subscribe(res => {
console.log('check phone', res);
        if (this.utils.checkRes(res)) {
          const { phone } = res.result;
          if (phone) {
            delete this.loginBody.email;  // 避免多帳號者更換帳號
            this.loginBody.signInType = SignTypeEnum.phone;
            this.loginBody.countryCode = countryCode;
            this.loginBody.mobileNumber = mobileNumber;
            this.handleLoginButton();
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
    const { email: oldEmail } = this.applyInfo.userProfile;
    const newEmail = (e as any).target.value.trim();
    if (newEmail !== oldEmail) {
      if (newEmail.length === 0) {
        this.alert.email = 'empty';
      } else if (!formTest.email.test(newEmail)) {
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
    this.checkRepeat(args, target).subscribe(res => {
console.log('check email', res);
      if (this.utils.checkRes(res)) {
        const { email } = res.result;
        if (email) {
          delete this.loginBody.countryCode;  // 避免多帳號者更換帳號
          delete this.loginBody.mobileNumber;
          this.loginBody.signInType = SignTypeEnum.email;
          this.loginBody.email = email;
          this.handleLoginButton();
        }

      }

    });

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
    const { loginLoading } = this.uiFlag;
    if (!loginLoading) {
      this.uiFlag.loginLoading = true;
      this.auth.loginServerV2(this.loginBody).subscribe(res => {
        if (this.utils.checkRes(res)) {
          const { signIn: { token } } = res;
          this.token = token;
          this.getEventUserProfile(token);
          const msg = 'Login success.';
          this.snackbar.open(msg, 'OK', { duration: 3000 } );
        } else {
          const msg = 'Login failed.';
          this.snackbar.open(msg, 'OK', { duration: 3000 } );
        }

        this.uiFlag.loginLoading = false;
      });

    }

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
console.log('check nickname', res);
        if (this.utils.checkRes(res)) {
          const { nickname } = res.result;
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
    const errorInput = document.querySelectorAll('.alert__text');
    if (errorInput.length > 0) {
      const targetElement = errorInput[0] as HTMLElement;
      const targetPosition = targetElement.offsetTop;
      window.scrollTo({top: targetPosition, behavior: 'smooth'});
    } else {
      this.applyActivity();
    }

  }

  /**
   * 報名賽事
   * @author kidin-1101111
   */
  applyActivity() {
console.log('apply', this.applyInfo);
    const { uiFlag: { applyLoading }, token } = this;
    if (!applyLoading) {

      if (token) Object.assign(this.applyInfo, { token });

      this.uiFlag.applyLoading = true;
      this.officialActivityService.applyEvent(this.applyInfo).subscribe(res => {
console.log('apply res', res);
        if (this.utils.checkRes(res)) {
          const { register } = res;
          if (!token) this.handleNewAccount(register);
          this.uiFlag.applyComplish = true;
        }

        this.uiFlag.applyLoading = false;
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

    this.auth.loginServerV2(body).subscribe();
  }

  /**
   * 根據確認指定資訊是否重複
   * @param args {any}-查詢條件
   * @param target {Array<string>}-欲取得之目標資訊
   * @author kidin-1101112
   */
  checkRepeat(args: any, target: Array<string>) {
    const body = {
      search: {
        userInfo: {
          args,
          target
        }
      }
    };

    return this.userProfileService.getAssignInfo(body);
  }

  /**
   * 根據是否已經登入與是否有帳號顯示登入按鈕
   * @author kidin-1101115
   */
  handleLoginButton() {
    if (this.token) {
      this.uiFlag.showLoginButton = false;
    } else {
      const { email, mobileNumber } = this.loginBody as any;
      this.uiFlag.showLoginButton = email || mobileNumber;
    }

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
      uiFlag: { newPasswordFormatError, upDatePasswordLoading, newPasswordUpdated },
      editAccountBody: { newPassword }
    } = this;

    if (
      !newPasswordFormatError
      && !upDatePasswordLoading
      && !newPasswordUpdated
      && newPassword
    ) {
      this.uiFlag.upDatePasswordLoading = true;
      const getIpApiDomain = 'https://api.ipify.org';
      this.getClientIp.requestJsonp(getIpApiDomain, 'format=jsonp', 'callback').pipe(
        switchMap(ipResult => {
          const ip = (ipResult as any).ip;
          return this.userInfoService.fetchEditAccountInfo(this.editAccountBody, ip).pipe(
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
console.log('create order', res);
      if (this.utils.checkRes(res)) {
        const { responseHtml } = res;
        const newElement = document.createElement('div');
        const target = document.querySelector('#main__page');
        newElement.innerHTML = responseHtml as any;
        target.appendChild(newElement);
        (document.getElementById('data_set') as any).submit();
      }
      
    });

  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

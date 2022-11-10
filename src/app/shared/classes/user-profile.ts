import { UserProfileInfo, SignInfo } from '../models/user-profile-info';
import dayjs from 'dayjs';
import { Unit } from '../enum/value-conversion';
import { HrBase } from '../enum/personal';
import { deepCopy } from '../utils/index';
import { AccessRight } from '../enum/accessright';
import { WeightTrainingLevel } from '../enum/weight-train';
import { BehaviorSubject } from 'rxjs';
import { ThirdParty } from '../enum/thirdParty';
import { BenefitTimeStartZone } from '../../core/enums/common';

const guestProfile: UserProfileInfo = {
  avatarUrl: '/assets/images/user2.png',
  birthday: dayjs().subtract(30, 'year').format('YYYYMMDD'), // 訪客預設30歲
  bodyHeight: 175,
  bodyWeight: 75,
  description: '',
  heartRateBase: HrBase.max,
  heartRateMax: 195,
  heartRateResting: 60,
  nickname: 'Guest',
  unit: Unit.metric,
  userId: -1, // 負數表示未登入
  themeImgUrl: null,
  weightTrainingStrengthLevel: 100,
};

/**
 * 處理登入者從 api 1010 取得的資訊
 */
export class User {
  /**
   * api 1010 內的 userProfile 物件(未登入則給予訪客預設值)
   */
  private _userProfile: UserProfileInfo = deepCopy(guestProfile);

  /**
   * userProfile observable 物件(未登入則給予訪客預設值)
   */
  private _rxUserProfile$ = new BehaviorSubject(deepCopy(guestProfile));

  /**
   * api 1003 或 1010 內的 signIn 物件
   */
  private _signInfo: SignInfo;

  /**
   * api 1010 內的 thirdPartyAgency 物件
   */
  private _thirdPartyAgency = new Map();

  constructor() {}

  /**
   * 使用者登出
   * @author kidin-1110314
   */
  logout() {
    this.initUser();
  }

  /**
   * 更新 userProfile
   * @author kidin-1110311
   */
  set userProfile(userProfile: UserProfileInfo) {
    this._userProfile = userProfile;
    this.updateRxUserProfile();
  }

  /**
   * 取得 userProfile
   * @author kidin-1110314
   */
  get userProfile() {
    return this._userProfile;
  }

  /**
   * 取得 rxjs userProfile 訂閱物件
   */
  get rxUserProfile() {
    return this._rxUserProfile$;
  }

  /**
   * 將 userProfile 切為訪客，並清空登入資訊
   * @author kidin-1110314
   */
  initUser() {
    const defaultUserProfile = deepCopy(guestProfile);
    this.userProfile = defaultUserProfile;
    this.signInfo = undefined;
    this._thirdPartyAgency.clear();
    this.updateRxUserProfile();
  }

  /**
   * 更新登入資訊
   * @author kidin-1110314
   */
  set signInfo(info: SignInfo) {
    this._signInfo = info;
  }

  /**
   * 取得登入資訊
   * @author kidin-1110314
   */
  get signInfo() {
    return this._signInfo;
  }

  /**
   * 更新第三方資訊
   * @author kidin-1110314
   */
  set thirdPartyAgency(thirdPartyAgency: Array<any>) {
    thirdPartyAgency.forEach((_thirdPart) => {
      const { interface: thirdPartyInterface, status } = _thirdPart;
      this._thirdPartyAgency.set(thirdPartyInterface, status);
    });
  }

  /**
   * 取得指定的第三方狀態
   * @param thirdPartyInterface {ThirdParty}
   */
  getThirdPartyStatus(thirdPartyInterface: ThirdParty) {
    return this._thirdPartyAgency.get(thirdPartyInterface);
  }

  /**
   * 更新第三方狀態
   */
  updateThirdPartyStatus(thirdPartyInterface: ThirdParty, status: boolean) {
    this._thirdPartyAgency.set(thirdPartyInterface, status);
  }

  /**
   * 取得系統使用權限
   * @author kidin-1110314
   */
  get systemAccessright(): AccessRight {
    return this.signInfo ? this.signInfo.developerValue : 99;
  }

  /**
   * 取得使用者編號
   */
  get userId() {
    return this._userProfile.userId;
  }

  /**
   * 取得使用者重訓程度
   */
  get weightTrainingStrengthLevel(): WeightTrainingLevel {
    return this._userProfile.weightTrainingStrengthLevel;
  }

  /**
   * 取得使用者暱稱
   */
  get nickname() {
    return this._userProfile.nickname;
  }

  /**
   * 取得使用者頭像
   */
  get icon() {
    return this._userProfile.avatarUrl;
  }

  /**
   * 取得使用者使用單位（公英制）
   */
  get unit() {
    return this._userProfile.unit;
  }

  /**
   * 取得個人設定效益時間有效開始心率區間
   */
  get benefitTimeStartZone() {
    return this._userProfile.customField?.activityTimeHRZ || BenefitTimeStartZone.zone2;
  }

  /**
   * 根據生日取得年齡
   */
  get age() {
    const currentDay = dayjs();
    const birthDay = dayjs(this._userProfile.birthday, 'YYYYMMDD');
    const age = currentDay.diff(birthDay, 'year');
    return age;
  }

  /**
   * 更新userProfile資訊
   * @param content {any}-更新內容
   */
  updatePartUserProfile(content: any) {
    Object.entries(content).forEach((_content) => {
      const [key, value] = _content;
      const originContent = this._userProfile[key];
      if (typeof originContent !== 'object' || Array.isArray(originContent)) {
        this._userProfile[key] = value;
      } else {
        this.userProfile[key] = {
          ...originContent,
          ...(value as object),
        };
      }
    });

    this.updateRxUserProfile();
  }

  /**
   * 更新 rxUserProfile
   */
  updateRxUserProfile() {
    this._rxUserProfile$.next(this._userProfile);
  }
}

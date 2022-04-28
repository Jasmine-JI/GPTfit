import { UserProfileDetail, SignInfo } from '../models/user-profile-info';
import dayjs from 'dayjs';
import { Unit } from '../models/bs-constant';
import { HrBase } from '../models/user-profile-info';
import { deepCopy, checkResponse } from '../utils/index';
import { Api10xxService } from '../../core/services/api-10xx.service';
import { combineLatest } from 'rxjs';
import { SignTypeEnum } from '../models/utils-type';


const guestProfile: UserProfileDetail = {
  avatarUrl: '/assets/images/user2.png',
  birthday: dayjs().subtract(30, 'year').format('YYYYMMDD'),  // 訪客預設30歲
  bodyHeight: 175,
  bodyWeight: 75,
  description: '',
  heartRateBase: HrBase.max,
  heartRateMax: 195,
  heartRateResting: 60,
  nickname: 'Guest',
  unit: Unit.metric,
  userId: -1,  // 複數表示未登入
  themeImgUrl: null,
  weightTrainingStrengthLevel: 100
};

/**
 * 處理登入者從 api 1010 取得的資訊
 */
export class User {

  /**
   * api 1010 內的 userProfile 物件(未登入則給予訪客預設值)
   */
  private _userProfile: UserProfileDetail = deepCopy(guestProfile);

  /**
   * api 1003 或 1010 內的 signIn 物件
   */
  private _signInfo: SignInfo;

  /**
   * api 1010 內的 thirdPartyAgency 物件
   */
  private _thirdPartyAgency: Array<any>;


  constructor(
    private api10xxService: Api10xxService
  ) {}

  /**
   * 透過 api 1003 登入後， 再透過 api 1010 取得 user profile
   * @param token {string}
   * @author kidin-1110314
   */
  tokenLogin(token: string = '') {
    if (token) {
      const loginBody = { token, signInType: SignTypeEnum.token };
      const userProfileBody = { token };
      combineLatest([
        this.api10xxService.fetchSignIn(loginBody),
        this.api10xxService.fetchGetUserProfile(userProfileBody)
      ]).subscribe(resultArray => {
        const [loginResult, userProfileResult] = resultArray;
        if (checkResponse(loginResult, false)) {
          const { thirdPartyAgency } = loginResult as any;
          this.thirdPartyAgency = thirdPartyAgency;
        }

        if (checkResponse(userProfileResult, true)) {
          const { signIn, userProfile } = userProfileResult as any;
          this.signInfo = signIn;
          this.userProfile = userProfile;
        }

      });

    }

  }

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
  set userProfile(userProfile: UserProfileDetail) {
    this._userProfile = userProfile;
  }

  /**
   * 取得 userProfile
   * @author kidin-1110314
   */
  get userProfile() {
    return this._userProfile;
  }

  /**
   * 將 userProfile 切為訪客，並清空登入資訊
   * @author kidin-1110314
   */
  initUser() {
    this._userProfile = deepCopy(guestProfile);
    this._signInfo = undefined;
    this._thirdPartyAgency = undefined;
  }

  /**
   * 更新登入資訊
   * @author kidin-1110314
   */
  set signInfo(signInfo: SignInfo) {
    this._signInfo = signInfo;
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
    this._thirdPartyAgency = thirdPartyAgency;
  }

  /**
   * 取得第三方資訊
   * @author kidin-1110314
   */
  get thirdPartyAgency() {
    return this._thirdPartyAgency;
  }

  /**
   * 取得系統使用權限
   * @author kidin-1110314
   */
  get systemAccessright() {
    return this._signInfo ? this._signInfo.developerValue : 99;
  }

}
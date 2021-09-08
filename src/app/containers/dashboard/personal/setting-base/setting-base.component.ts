import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserInfoService } from '../../services/userInfo.service';
import { SettingsService } from '../../services/settings.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { Sex, sex } from '../../models/userProfileInfo';
import { unit, ft, lb } from '../../../../shared/models/bs-constant';
import { formTest } from '../../../portal/models/form-test';


const heightCoefficient = 100 * ft;

@Component({
  selector: 'app-setting-base',
  templateUrl: './setting-base.component.html',
  styleUrls: ['./setting-base.component.scss', '../personal-child-page.scss']
})
export class SettingBaseComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    progress: 100,
    editMode: 'close',
    nicknameAlert: <'repeat' | 'format'>null,
  }

  /**
   * 使用者設定
   */
  setting = {
    nickname: '',
    bodyHeight: 175,
    bodyWeight: 70,
    birthday: moment().subtract(30, 'years').startOf('year').valueOf(),  // 預設30歲
    gender: 0
  }

  /**
   * 紀錄需公英制轉換的數據，其數值是否更新，
   * 避免因四捨五入造成每次儲存皆異動到該數值
   */
  editFlag = {
    bodyHeight: false,
    bodyWeight: false
  }

  userInfo: any;
  readonly sex = sex;
  readonly unit = unit;

  constructor(
    private userInfoService: UserInfoService,
    private settingService: SettingsService,
    private utils: UtilsService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    this.getRxUserProfile();
  }

  /**
   * 從rxjs取得userProfile
   * @author kidin-1100818
   */
  getRxUserProfile() {
    this.userInfoService.getRxTargetUserInfo().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userInfo = res;
    });

  }

  /**
   * 開啟編輯模式
   * @author kidin-1100818
   */
  openEditMode() {
    this.uiFlag.editMode = 'edit';
    this.userInfoService.setRxEditMode('edit');
    const { nickname, birthday, bodyHeight, bodyWeight, gender, unit: userUnit } = this.userInfo,
          isMetric = userUnit === unit.metric;
    this.setting = {
      nickname,
      bodyHeight: this.utils.valueConvert(bodyHeight, !isMetric, true, heightCoefficient, 2),
      bodyWeight: this.utils.valueConvert(bodyWeight, !isMetric, true, lb, 2),
      birthday: moment(birthday, 'YYYYMMDD').valueOf(),
      gender,
    };

    this.editFlag = {
      bodyHeight: false,
      bodyWeight: false
    }

  }

  /**
   * 取消編輯
   * @author kidin-1100818
   */
  cancelEdit() {
    this.uiFlag.nicknameAlert = null;
    this.uiFlag.editMode = 'close';
    this.userInfoService.setRxEditMode('close');
  }

  /**
   * 完成編輯
   * @author kidin-1100818
   */
  editComplete() {
    const token = this.utils.getToken(),
          newSet = this.checkEdit(this.userInfo, this.setting);
    if (newSet) {

      if (!this.uiFlag.nicknameAlert) {
        const body = {
          token,
          userProfile: {
            ...newSet
          }
        };

        this.settingService.updateUserProfile(body).subscribe(res => {
          const {processResult} = res as any;
          if (!processResult) {
            const { apiCode, resultMessage, resultCode } = res as any;
            this.utils.handleError(resultCode, apiCode, resultMessage);
          } else {
            const { apiCode, resultMessage, resultCode } = processResult;
            if (resultCode !== 200) {
              this.utils.handleError(resultCode, apiCode, resultMessage);
            } else {
              this.uiFlag.editMode = 'close';
              this.userInfoService.setRxEditMode('complete');
            }

          }

        });

      }
      
    } else {
      this.uiFlag.editMode = 'close';
      this.userInfoService.setRxEditMode('complete');
    }
    
  }

  /**
   * 確認該設定是否有更新，若有才寫至request body
   * @param oldSet {any}-原始userProfile
   * @param newSet {any}-更新過後的userProfile
   * @author kidin-1100825
   */
  checkEdit(oldSet: any, newSet: any): any {
    let updateObj = {},
        isUpdate = false;
    for (let _key in newSet) {

      if (newSet.hasOwnProperty(_key)) {
        const oldValue = oldSet[_key],
              newValue = newSet[_key];
        if (typeof newSet[_key] === 'object') {
          const updateChild = this.checkEdit(oldValue, newValue);
          if (updateChild) {
            isUpdate = true;
            updateObj = {
              [_key]: updateChild,
              ...updateObj
            };
          }

        } else {
          const revertNewValue = this.valueRevert(_key, newValue);
          if (revertNewValue != oldValue) {
            isUpdate = true;
            updateObj = {
              [_key]: revertNewValue,
              ...updateObj
            };

          }

        }

      }

    }

    return isUpdate ? updateObj : isUpdate;
  }

  /**
   * 將數值還原為公制
   * @param key {string}
   * @param value {string | number}
   * @author kidin-1100825
   */
  valueRevert(key: string, value: string | number) {
    const isMetric = this.userInfo.unit === unit.metric,
          edited = this.editFlag[key];
    switch (key) {
      case 'bodyHeight':
        if (edited) {
          return isMetric ? value : this.utils.valueConvert(value as number, true, false, heightCoefficient, 2);
        } else {
          return this.userInfo[key];
        }
      case 'bodyWeight':
        if (edited) {
          return isMetric ? value : this.utils.valueConvert((value as number), true, false, lb, 2);
        } else {
          return this.userInfo[key];
        }
      case 'birthday':
        return moment(value).format('YYYYMMDD');
      default:
        return value;
        
    }


  }

  /**
   * 檢查暱稱是否重複，及是否符合格式
   * @param e {Event | MouseEvent}
   * @author kidin-1100818
   */
  handleNicknameInput(e: Event | MouseEvent) {
    const name = (e as any).target.value;
    if (name.length < 4) {
      this.uiFlag.nicknameAlert = 'format';
    } else {

      if (name !== this.userInfo.nickname) {
        const body = {
          token: this.utils.getToken(),
          nickname: name
        };

        this.userProfileService.checkNickname(body).subscribe(res => {
          const { resultCode, resultMessage, apiCode, repeat } = res;
          if (resultCode !== 200) {
            this.utils.handleError(resultCode, apiCode, resultMessage);
          } else {

            if (repeat) {
              this.uiFlag.nicknameAlert = 'repeat';
            } else {
              this.uiFlag.nicknameAlert = null;
              this.setting.nickname = name;
            }

          }

        });

      } else {
        this.uiFlag.nicknameAlert = null;
      }

    }

  }

  /**
   * 確認是否輸入為數字
   * @param e {KeyboardEvent}
   * @author kidin-1100823
   */
  checkFormat(e: KeyboardEvent) {
    const { key, target: { value } } = e as any,
          numTest = formTest.number.test(`${key}`),
          notFnKey = key.length <= 1,
          checkDot = !value.includes('.') && key === '.';
    if (!numTest && notFnKey && !checkDot) {
      e.preventDefault();
    }

  }

  /**
   * 檢查是否為合理值
   * @param e {Event | MouseEvent}
   * @author kidin-1100818
   */
  handleHeightInput(e: Event | MouseEvent) {
    const oldValue = this.userInfo.bodyHeight,
          inputValue = +(e as any).target.value,
          testFormat = formTest.decimalValue.test(`${inputValue}`),
          isMetric = this.userInfo.unit === unit.metric,
          newValue = this.utils.valueConvert(inputValue, !isMetric, false, heightCoefficient, 2),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.bodyHeight = true;
      const min = 100,
            max = 255;
      if (newValue < min) {
        this.setting.bodyHeight = this.utils.valueConvert(min, !isMetric, true, heightCoefficient, 2);
      } else if (newValue > max) {
        this.setting.bodyHeight = this.utils.valueConvert(max, !isMetric, true, heightCoefficient, 2);
      } else {
        this.setting.bodyHeight = +inputValue;
      }

      (e as any).target.value = this.setting.bodyHeight;
    } else {
      this.editFlag.bodyHeight = false;
      const { bodyHeight } = this.userInfo;
      (e as any).target.value = this.utils.valueConvert(bodyHeight, !isMetric, true, heightCoefficient, 2);
    }

  }

  /**
   * 檢查是否為合理值
   * @param e {Event | MouseEvent}
   * @author kidin-1100818
   */
  handleWeightInput(e: Event | MouseEvent) {
    const oldValue = this.userInfo.bodyWeight,
          inputValue = +(e as any).target.value,
          testFormat = formTest.decimalValue.test(`${inputValue}`),
          isMetric = this.userInfo.unit === unit.metric,
          newValue = this.utils.valueConvert(inputValue, !isMetric, false, ft, 2),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.bodyWeight = true;
      const min = 40,
            max = 255;
      if (newValue < min) {
        this.setting.bodyWeight = this.utils.valueConvert(min, !isMetric, true, lb, 2);
      } else if (newValue > max) {
        this.setting.bodyWeight = this.utils.valueConvert(max, !isMetric, true, lb, 2);;
      } else {
        this.setting.bodyWeight = +inputValue;
      }

      (e as any).target.value = this.setting.bodyWeight;
    } else {
      this.editFlag.bodyWeight = false;
      const { bodyWeight } = this.userInfo;
      (e as any).target.value = this.utils.valueConvert(bodyWeight, !isMetric, true, lb, 2);
    }

  }

  /**
   * 取得所選日期
   * @param e {any}
   * @author kidin-1100818
   */
  getSelectDate(e: any) {
    const { startDate } = e;
    this.setting.birthday = moment(startDate).valueOf();
  }

  /**
   * 變更性別
   * @param sex {Sex}-性別
   * @author kidin-1100818
   */
  changeGender(sex: Sex) {
    this.setting.gender = sex;
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
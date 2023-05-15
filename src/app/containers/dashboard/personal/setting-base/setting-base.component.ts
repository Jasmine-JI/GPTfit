import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import {
  UserService,
  NodejsApiService,
  AuthService,
  ApiCommonService,
} from '../../../../core/services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import dayjs from 'dayjs';
import { Sex } from '../../../../shared/enum/personal';
import { lb } from '../../../../shared/models/bs-constant';
import { DataUnitType } from '../../../../core/enums/common';
import { formTest } from '../../../../shared/models/form-test';
import { DashboardService } from '../../services/dashboard.service';
import { checkResponse, valueConvert, bodyHeightTransfer } from '../../../../core/utils';

@Component({
  selector: 'app-setting-base',
  templateUrl: './setting-base.component.html',
  styleUrls: ['./setting-base.component.scss', '../personal-child-page.scss'],
})
export class SettingBaseComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input() patchEditPrivacy: boolean;

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    progress: 100,
    expand: true,
    editMode: 'close',
    nicknameAlert: <'repeat' | 'format' | null>null,
    heightAlert: false,
  };

  /**
   * 使用者設定
   */
  setting = {
    nickname: '',
    bodyHeight: <string | number>175,
    bodyWeight: 70,
    birthday: dayjs().subtract(30, 'year').startOf('year').valueOf(), // 預設30歲
    gender: 0,
  };

  /**
   * 紀錄需公英制轉換的數據，其數值是否更新，
   * 避免因四捨五入造成每次儲存皆異動到該數值
   */
  editFlag = {
    bodyHeight: false,
    bodyWeight: false,
  };

  userInfo: any;
  readonly Sex = Sex;
  readonly DataUnitType = DataUnitType;

  constructor(
    private apiCommonService: ApiCommonService,
    private userService: UserService,
    private dashboardService: DashboardService,
    private nodejsApiService: NodejsApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getRxUserProfile();
  }

  /**
   * 從rxjs取得userProfile
   * @author kidin-1100818
   */
  getRxUserProfile() {
    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.userInfo = res;
        this.openEditMode();
      });
  }

  /**
   * 開啟編輯模式
   * @author kidin-1100818
   */
  openEditMode() {
    this.uiFlag.editMode = 'edit';
    this.dashboardService.setRxEditMode('edit');
    const { nickname, birthday, bodyHeight, bodyWeight, gender, unit: userUnit } = this.userInfo;
    const isMetric = userUnit === DataUnitType.metric;
    this.setting = {
      nickname,
      bodyHeight: bodyHeightTransfer(bodyHeight, !isMetric, true),
      bodyWeight: valueConvert(bodyWeight, !isMetric, true, lb, 1),
      birthday: dayjs(birthday, 'YYYYMMDD').valueOf(),
      gender,
    };

    this.editFlag = {
      bodyHeight: false,
      bodyWeight: false,
    };
  }

  /**
   * 取消編輯
   * @author kidin-1100818
   */
  cancelEdit() {
    this.uiFlag.nicknameAlert = null;
    this.uiFlag.editMode = 'close';
    // this.dashboardService.setRxEditMode('close');
  }

  /**
   * 完成編輯
   * @author kidin-1100818
   */
  editComplete() {
    const newSet = this.checkEdit(this.userInfo, this.setting);
    if (newSet) {
      const { nicknameAlert, heightAlert } = this.uiFlag;
      if (!nicknameAlert && !heightAlert) {
        this.userService.updateUserProfile(newSet).subscribe((res) => {
          if (checkResponse(res)) this.dashboardService.setRxEditMode('complete');
        });
      }
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
    for (const _key in newSet) {
      if (Object.prototype.hasOwnProperty.call(newSet, _key)) {
        const oldValue = oldSet[_key],
          newValue = newSet[_key];
        if (typeof newSet[_key] === 'object') {
          const updateChild = this.checkEdit(oldValue, newValue);
          if (updateChild) {
            isUpdate = true;
            updateObj = {
              [_key]: updateChild,
              ...updateObj,
            };
          }
        } else {
          const revertNewValue = this.valueRevert(_key, newValue);
          if (revertNewValue != oldValue) {
            isUpdate = true;
            updateObj = {
              [_key]: revertNewValue,
              ...updateObj,
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
    const isMetric = this.userInfo.unit === DataUnitType.metric,
      edited = this.editFlag[key];
    switch (key) {
      case 'bodyHeight':
        if (edited) {
          return isMetric ? value : bodyHeightTransfer(value, true, false);
        } else {
          return this.userInfo[key];
        }
      case 'bodyWeight':
        if (edited) {
          return isMetric ? value : valueConvert(value as number, true, false, lb, 1);
        } else {
          return this.userInfo[key];
        }
      case 'birthday':
        return dayjs(value).format('YYYYMMDD');
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
    const { nickname } = formTest;
    if (!nickname.test(name)) {
      this.uiFlag.nicknameAlert = 'format';
    } else {
      if (name !== this.userInfo.nickname) {
        const body = {
          token: this.authService.token,
          nickname: name,
        };

        this.nodejsApiService.checkNickname(body).subscribe((res) => {
          const { resultCode, resultMessage, apiCode, repeat } = res;
          if (resultCode !== 200) {
            this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
          } else {
            if (repeat) {
              this.uiFlag.nicknameAlert = 'repeat';
            } else {
              this.uiFlag.nicknameAlert = null;
              this.setting.nickname = name;
              this.editComplete();
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
    const {
        key,
        target: { value },
      } = e as any,
      numTest = formTest.number.test(`${key}`),
      notFnKey = key.length <= 1,
      checkDot = !value.includes('.') && key === '.';
    if (!numTest && notFnKey && !checkDot) {
      e.preventDefault();
    }
  }

  /**
   * 確認身高欄位是否輸入為數字或"
   * @param e {KeyboardEvent}
   * @author kidin-1100823
   */
  checkHeightFormat(e: KeyboardEvent) {
    if (this.userInfo.unit === DataUnitType.metric) {
      this.checkFormat(e);
    } else {
      const {
          key,
          target: { value },
        } = e as any,
        testReg = /\d|"/,
        numTest = testReg.test(`${key}`),
        notFnKey = key.length <= 1,
        checkQuotation = !value.includes('"') && key === '"';
      if (!numTest && notFnKey && !checkQuotation) {
        e.preventDefault();
      }
    }
  }

  /**
   * 確認體重欄位是否輸入為數字或.
   * @param e {KeyboardEvent}
   * @author kidin-1100823
   */
  checkWeightFormat(e: KeyboardEvent) {
    if (this.userInfo.unit === DataUnitType.metric) {
      this.checkFormat(e);
    } else {
      const { key } = e as any,
        numTest = formTest.number.test(`${key}`),
        notFnKey = key.length <= 1;
      if (!numTest && notFnKey) {
        e.preventDefault();
      }
    }
  }

  /**
   * 檢查是否為合理值
   * @param e {Event | MouseEvent}
   * @author kidin-1100818
   */
  handleHeightInput(e: Event | MouseEvent) {
    const isMetric = this.userInfo.unit === DataUnitType.metric,
      { decimalValue, imperialHeight } = formTest,
      oldValue = this.userInfo.bodyHeight,
      { value } = (e as any).target,
      inputValue = isMetric ? +value : value,
      testReg = isMetric ? decimalValue : imperialHeight,
      testFormat = testReg.test(`${inputValue}`),
      newValue = bodyHeightTransfer(inputValue, !isMetric, false),
      valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.bodyHeight = true;
      const min = 100,
        max = 255;
      if (+newValue < min) {
        this.setting.bodyHeight = bodyHeightTransfer(min, !isMetric, true);
      } else if (+newValue > max) {
        this.setting.bodyHeight = bodyHeightTransfer(max, !isMetric, true);
      } else {
        this.setting.bodyHeight = inputValue;
      }

      (e as any).target.value = this.setting.bodyHeight;
      this.uiFlag.heightAlert = false;
      this.editComplete();
    } else {
      if (!testFormat) {
        this.uiFlag.heightAlert = true;
      } else {
        const { bodyHeight } = this.userInfo;
        (e as any).target.value = bodyHeightTransfer(bodyHeight, !isMetric, true);
        this.uiFlag.heightAlert = false;
      }

      this.editFlag.bodyHeight = false;
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
      isMetric = this.userInfo.unit === DataUnitType.metric,
      newValue = valueConvert(inputValue, !isMetric, false, lb, 1),
      valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.bodyWeight = true;
      const min = 40,
        max = 255;
      if (newValue < min) {
        this.setting.bodyWeight = valueConvert(min, !isMetric, true, lb, 1);
      } else if (newValue > max) {
        this.setting.bodyWeight = valueConvert(max, !isMetric, true, lb, 1);
      } else {
        this.setting.bodyWeight = +inputValue;
      }

      (e as any).target.value = this.setting.bodyWeight;
      this.editComplete();
    } else {
      this.editFlag.bodyWeight = false;
      const { bodyWeight } = this.userInfo;
      (e as any).target.value = valueConvert(bodyWeight, !isMetric, true, lb, 1);
    }
  }

  /**
   * 取得所選日期
   * @param e {any}
   * @author kidin-1100818
   */
  getSelectDate(e: any) {
    const { startDate } = e;
    this.setting.birthday = dayjs(startDate).valueOf();
    this.editComplete();
  }

  /**
   * 變更性別
   * @param sex {Sex}-性別
   * @author kidin-1100818
   */
  changeGender(sex: Sex) {
    this.setting.gender = sex;
    this.editComplete();
  }

  /**
   * 展開或收合整個基本資訊內容
   * @author kidin-1100922
   */
  handleFolder() {
    this.uiFlag.expand = !this.uiFlag.expand;
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

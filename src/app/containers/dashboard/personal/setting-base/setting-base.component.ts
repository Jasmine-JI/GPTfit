import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import dayjs from 'dayjs';
import { Sex } from '../../../../shared/models/user-profile-info';
import { Unit, ft, lb } from '../../../../shared/models/bs-constant';
import { formTest } from '../../../../shared/models/form-test';
import { DashboardService } from '../../services/dashboard.service';


@Component({
  selector: 'app-setting-base',
  templateUrl: './setting-base.component.html',
  styleUrls: ['./setting-base.component.scss', '../personal-child-page.scss']
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
    nicknameAlert: <'repeat' | 'format'>null,
    heightAlert: false
  }

  /**
   * 使用者設定
   */
  setting = {
    nickname: '',
    bodyHeight: <string | number>175,
    bodyWeight: 70,
    birthday: dayjs().subtract(30, 'years').startOf('year').valueOf(),  // 預設30歲
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
  readonly Sex = Sex;
  readonly Unit = Unit;

  constructor(
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private dashboardService: DashboardService
  ) { }

  ngOnInit(): void {
    this.getRxUserProfile();
  }

  /**
   * 從rxjs取得userProfile
   * @author kidin-1100818
   */
  getRxUserProfile() {
    this.userProfileService.getRxTargetUserInfo().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
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
    const { nickname, birthday, bodyHeight, bodyWeight, gender, unit: userUnit } = this.userInfo,
          isMetric = userUnit === Unit.metric;
    this.setting = {
      nickname,
      bodyHeight: this.utils.bodyHeightTransfer(bodyHeight, !isMetric, true),
      bodyWeight: this.utils.valueConvert(bodyWeight, !isMetric, true, lb, 0),
      birthday: dayjs(birthday, 'YYYYMMDD').valueOf(),
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
    // this.dashboardService.setRxEditMode('close');
  }

  /**
   * 完成編輯
   * @author kidin-1100818
   */
  editComplete() {
    const token = this.utils.getToken(),
          newSet = this.checkEdit(this.userInfo, this.setting);
    if (newSet) {
      const { nicknameAlert, heightAlert } = this.uiFlag;
      if (!nicknameAlert && !heightAlert) {
        const body = {
          token,
          userProfile: {
            ...newSet
          }
        };

        this.userProfileService.updateUserProfile(body).subscribe(res => {
          const {processResult} = res as any;
          if (!processResult) {
            const { apiCode, resultMessage, resultCode } = res as any;
            this.utils.handleError(resultCode, apiCode, resultMessage);
          } else {
            const { apiCode, resultMessage, resultCode } = processResult;
            if (resultCode !== 200) {
              this.utils.handleError(resultCode, apiCode, resultMessage);
            } else {
              // this.uiFlag.editMode = 'close';  // 常駐編輯狀態
              this.dashboardService.setRxEditMode('complete');
              this.updateRxUserProfile(newSet);
            }

          }

        });

      }
      
    }
    
  }

  /**
   * 更新rxjs儲存之userProfile
   * @author kidin-1110208
   */
  updateRxUserProfile(newSet: any) {
    this.userInfo = {
      ...this.userInfo,
      ...newSet
    };

    this.userProfileService.setRxUserProfile(this.userInfo);
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
    const isMetric = this.userInfo.unit === Unit.metric,
          edited = this.editFlag[key];
    switch (key) {
      case 'bodyHeight':
        if (edited) {
          return isMetric ? value : this.utils.bodyHeightTransfer(value, true, false);
        } else {
          return this.userInfo[key];
        }
      case 'bodyWeight':
        if (edited) {
          return isMetric ? value : this.utils.valueConvert((value as number), true, false, lb, 1);
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
    const { key, target: { value } } = e as any,
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
    if (this.userInfo.unit === Unit.metric) {
      this.checkFormat(e);
    } else {
      const { key, target: { value } } = e as any,
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
    if (this.userInfo.unit === Unit.metric) {
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
    const isMetric = this.userInfo.unit === Unit.metric,
          { decimalValue, imperialHeight } = formTest,
          oldValue = this.userInfo.bodyHeight,
          { value } = (e as any).target,
          inputValue = isMetric ? +value : value,
          testReg = isMetric ? decimalValue : imperialHeight,
          testFormat = testReg.test(`${inputValue}`),
          newValue = this.utils.bodyHeightTransfer(inputValue, !isMetric, false),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.bodyHeight = true;
      const min = 100,
            max = 255;
      if (newValue < min) {
        this.setting.bodyHeight = this.utils.bodyHeightTransfer(min, !isMetric, true);
      } else if (newValue > max) {
        this.setting.bodyHeight = this.utils.bodyHeightTransfer(max, !isMetric, true);
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
        (e as any).target.value = this.utils.bodyHeightTransfer(bodyHeight, !isMetric, true);
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
          isMetric = this.userInfo.unit === Unit.metric,
          newValue = this.utils.valueConvert(inputValue, !isMetric, false, lb, 0),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.bodyWeight = true;
      const min = 40,
            max = 255;
      if (newValue < min) {
        this.setting.bodyWeight = this.utils.valueConvert(min, !isMetric, true, lb, 0);
      } else if (newValue > max) {
        this.setting.bodyWeight = this.utils.valueConvert(max, !isMetric, true, lb, 0);
      } else {
        this.setting.bodyWeight = +inputValue;
      }

      (e as any).target.value = this.setting.bodyWeight;
      this.editComplete();
    } else {
      this.editFlag.bodyWeight = false;
      const { bodyWeight } = this.userInfo;
      (e as any).target.value = this.utils.valueConvert(bodyWeight, !isMetric, true, lb, 0);
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
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { UtilsService } from '../../../../shared/services/utils.service';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { ft, inch, lb } from '../../../../shared/models/bs-constant';
import { Unit } from '../../../../shared/enum/value-conversion';
import { HrBase } from '../../../../shared/enum/personal';
import { formTest } from '../../../../shared/models/form-test';
import { HrZoneRange } from '../../../../shared/models/chart-data';
import dayjs from 'dayjs';
import { TranslateService } from '@ngx-translate/core';
import { DashboardService } from '../../services/dashboard.service';
import { TargetField, PersonalTarget, TargetCondition } from '../../../../shared/models/sport-target';
import { ConditionSymbols } from '../../../../shared/enum/sport-target';
import { DateUnit } from '../../../../shared/enum/report';
import { deepCopy, checkResponse, mathRounding, valueConvert } from '../../../../shared/utils/index';
import { SportsTargetDefault } from '../../../../shared/models/variable-init';
import { UserService } from '../../../../core/services/user.service';
import { getUserHrRange, getUserFtpZone } from '../../../../shared/utils/sports';

enum DominantHand {
  right,
  left
}

enum AutoStepTarget {
  close,
  open
}

type TimeEditType = 'hour' | 'min';
type SetType = 'hr' | 'ftp' | 'activity' | 'sleep' | 'target' | 'sportsTarget';
const wheelSizeCoefficient = inch * 10;

@Component({
  selector: 'app-setting-prefer',
  templateUrl: './setting-prefer.component.html',
  styleUrls: ['./setting-prefer.component.scss', '../personal-child-page.scss']
})
export class SettingPreferComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private clickEvent = new Subscription();
  private wheelEvent = new Subscription();
  private touchEvent = new Subscription();
  private dialogClickEvent = new Subscription();

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    progress: 100,
    showTimeSelector: null,
    valueShifting: false,
    isMobile: 'ontouchmove' in window,
    expand: false,
    showEditDialog: <SetType>null,
    showCycleList: false,
    showFiledNameList: false
  };

  /**
   * 使用者設定
   */
  setting = {
    unit: Unit.metric,
    strideLengthCentimeter: 90,
    heartRateBase: HrBase.max,
    heartRateMax: 190,
    heartRateResting: 60,
    normalBedTime: '23:00',
    normalWakeTime: '08:00',
    wheelSize: 2000,
    autoTargetStep: AutoStepTarget.close,
    cycleFtp: 200,
    handedness: DominantHand.right,
    target: {
      calorie: 2500,
      distance: 1000,
      elevGain: 35,
      fitTime: 1200,
      sleep: 28800,
      step: 5000,
      bodyWeight: 70,
      muscleRate: 50,
      fatRate: 20
    }

  };

  /**
   * 個人運動目標(預設值)
   */
  sportsTarget: PersonalTarget = deepCopy(SportsTargetDefault);

  /**
   * 新的目標條件
   */
  newCondition: TargetCondition = {
    filedName: <TargetField>'',
    symbols: ConditionSymbols.greaterEqual,
    filedValue: null
  };

  /**
   * 紀錄需公英制轉換的數據，其數值是否更新，
   * 避免因四捨五入造成每次儲存皆異動到該數值
   */
  editFlag = {
    strideLengthCentimeter: false,
    wheelSize: false,
    distance: false,
    bodyWeight: false
  };

  /**
   * 時間選擇器用
   */
  timeSelector = {
    hourList: ['20', '21', '22', '23', '00', '01', '02', '03', '04'],
    minList: ['56', '57', '58', '59', '00', '01', '02', '03', '04'],
    hour: '00',
    min: '00'
  };

  userInfo: any;
  userHrZone: HrZoneRange;
  userFtpZone: any;
  readonly HrBase = HrBase;
  readonly Unit = Unit;
  readonly DominantHand = DominantHand;
  readonly AutoStepTarget = AutoStepTarget;
  readonly DateUnit = DateUnit;

  constructor(
    private utils: UtilsService,
    private translate: TranslateService,
    private dashboardService: DashboardService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.getRxUserProfile();
  }

  /**
   * 從rxjs取得userProfile
   * @author kidin-1100818
   */
  getRxUserProfile() {
    this.userService.getUser().rxUserProfile.pipe(
      map(resp => {
        const { handedness } = resp;
        if (handedness === undefined || resp.length === 0) {
          resp.handedness = DominantHand.right;
        }

        return resp;
      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userInfo = res;
    });

  }

  /**
   * 開啟設定彈跳框
   * @param type {SetType}-設定類別
   * @author kidin-1100923
   */
  showEditDialog(type: SetType) {
    this.uiFlag.showEditDialog = type;
    switch (type) {
      case 'sportsTarget':
        this.handleSportTargetDialog();
        break;
      default:
        this.handleSettingDialog();
        break;
    }

  }

  /**
   * 處理設定運動目標所需資訊
   */
  handleSportTargetDialog() {
    const { workoutTarget } = this.userInfo;
    if (workoutTarget && Object.keys(workoutTarget).length > 0) {
      this.sportsTarget = deepCopy(workoutTarget);
    }
    
  }

  /**
   * 處理設定其他偏好設定所需資訊
   */
  handleSettingDialog() {
    const {
      unit: userUnit,
      strideLengthCentimeter,
      heartRateBase,
      heartRateMax,
      heartRateResting,
      normalBedTime,
      normalWakeTime,
      wheelSize,
      autoTargetStep,
      cycleFtp,
      handedness,
      target: {
        calorie,
        distance,
        elevGain,
        fitTime,
        sleep,
        step,
        bodyWeight,
        muscleRate,
        fatRate
      }
    } = this.userInfo;

    const isMetric = userUnit === Unit.metric;
    this.setting = {
      unit: userUnit,
      strideLengthCentimeter: valueConvert(strideLengthCentimeter, !isMetric, true, inch, 1),
      heartRateBase,
      heartRateMax,
      heartRateResting,
      normalBedTime,
      normalWakeTime,
      wheelSize: isMetric ? wheelSize : valueConvert(wheelSize, !isMetric, true, wheelSizeCoefficient, 1),
      autoTargetStep,
      cycleFtp,
      handedness,
      target: {
        calorie,
        distance: valueConvert(distance, !isMetric, true, ft, 2),
        elevGain,
        fitTime: mathRounding(fitTime / 60, 0),
        sleep: mathRounding(sleep / 3600, 1),
        step,
        bodyWeight: valueConvert(bodyWeight, !isMetric, true, lb, 1),
        muscleRate,
        fatRate
      }

    };

    this.editFlag = {
      strideLengthCentimeter: false,
      wheelSize: false,
      distance: false,
      bodyWeight: false
    }

    this.handleCountHrZone();
    this.handleCountFtpZone();
  }

  /**
   * 關閉彈跳視窗
   */
  closeDialog() {
    if (this.uiFlag.progress === 100) {
      this.uiFlag.showEditDialog = null;
    }
    
  }

  /**
   * 完成編輯
   * @author kidin-1100818
   */
  editComplete() {
    const { showEditDialog } = this.uiFlag;
    if (showEditDialog === 'sportsTarget') return this.updateSportsTarget();
    return this.updatePreferSetting();
  }

  /**
   * 更新運動目標設定
   */
  updateSportsTarget() {
    const updateContent = { workoutTarget: this.sportsTarget };
    this.saveSettingChange(updateContent);
  }

  /**
   * 更新運動目標以外的偏好設定，若未編輯任何選項則僅關閉視窗 
   */
  updatePreferSetting() {
    const newSet = this.checkEdit(this.userInfo, this.setting);
    newSet ? this.saveSettingChange(newSet) : this.closeDialog();
  }

  /**
   * 將變更之設定儲存至雲端
   * @param updateContent {any}-欲更新的內容
   */
  saveSettingChange(updateContent: any) {
    if (this.uiFlag.progress === 100) {
      this.uiFlag.progress = 30;
      this.userService.updateUserProfile(updateContent).pipe(
        switchMap(res => this.translate.get('hellow world').pipe(
          map(resp => res)
        )),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(res => {
        if (!checkResponse(res, false)) {
          const errorMsg = this.translate.instant('universal_popUpMessage_updateFailed');
          this.utils.showSnackBar(errorMsg);
          this.uiFlag.progress = 100;
        } else {
          this.uiFlag.progress = 100;
          this.closeDialog();
          const successMsg = this.translate.instant('universal_status_updateCompleted');
          this.utils.showSnackBar(successMsg);
          this.dashboardService.setRxEditMode('complete');
        }

      });

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
    const isMetric = this.setting.unit === Unit.metric,
          edited = this.editFlag[key];
    switch (key) {
      case 'strideLengthCentimeter':
        if (edited) {
          return isMetric ? value : valueConvert(+value, true, false, inch, 1);
        } else {
          return this.userInfo[key];
        }
      case 'wheelSize':
        if (edited) {
          return isMetric ? value : valueConvert(+value, true, false, wheelSizeCoefficient, 1);
        } else {
          return this.userInfo[key];
        }
      case 'distance':
        if (edited) {
          return isMetric ? value : valueConvert(+value, true, false, ft, 2);
        } else {
          return this.userInfo.target[key];
        }
      case 'bodyWeight':
        if (edited) {
          return isMetric ? value : valueConvert(+value, true, false, lb, 1);
        } else {
          return this.userInfo.target[key];
        }
      case 'fitTime':
          return mathRounding(+value * 60, 0);
      case 'sleep':
          return mathRounding(+value * 3600, 0);
      default:
        return value;
        
    }


  }

  /**
   * 變更心率法
   * @param base {HrBase}-心率法
   * @author kidin-1100820
   */
  changeHrBase(base: HrBase) {
    this.setting.heartRateBase = base;
    this.handleCountHrZone();
  }

  /**
   * 確認是否輸入為數字
   * @param e {KeyboardEvent}
   * @author kidin-1100823
   */
  checkFormat(e: KeyboardEvent, haveDot = false) {
    const { key, target: { value } } = e as any,
          numTest = formTest.number.test(`${key}`),
          isFnKey = key.length > 1,
          checkDot = key === '.' && haveDot && !value.includes('.');
    if (!(numTest || isFnKey || checkDot)) {
      e.preventDefault();
    }

  }

  /**
   * 變更最大心率
   * @param e {MouseEvent}
   * @author kidin-1100820
   */
  handleMaxHrInput(e: MouseEvent) {
    const inputValue = +(e as any).target.value;
    if (inputValue && formTest.number.test(`${inputValue}`)) {
      const min = 140,
            max = 220;
      if (inputValue < min) {
        this.setting.heartRateMax = min;
      } else if (inputValue > max) {
        this.setting.heartRateMax = max;
      } else {
        this.setting.heartRateMax = inputValue;
      }

      (e as any).target.value = this.setting.heartRateMax;
    } else {
      const { heartRateMax } = this.userInfo;
      (e as any).target.value = heartRateMax;
    }

    this.handleCountHrZone();
  }

  /**
   * 變更休息心率
   * @param e {MouseEvent}
   * @author kidin-1100820
   */
  handleRestHrInput(e: MouseEvent) {
    const inputValue = +(e as any).target.value;
    if (inputValue && formTest.number.test(`${inputValue}`)) {
      const min = 40,
            max = 100;
      if (inputValue < min) {
        this.setting.heartRateResting = min;
      } else if (inputValue > max) {
        this.setting.heartRateResting = max;
      } else {
        this.setting.heartRateResting = inputValue;
      }

      (e as any).target.value = this.setting.heartRateResting;
    } else {
      const { heartRateResting } = this.userInfo;
      (e as any).target.value = heartRateResting;
    }

  }

  /**
   * 變更功能性閾值功率
   * @param e {MouseEvent}
   * @author kidin-1100824
   */
  handleCycleFtpInput(e: MouseEvent) {
    const inputValue = +(e as any).target.value;
    if (inputValue && formTest.number.test(`${inputValue}`)) {
      const min = 1,
            max = 600;
      if (inputValue < min) {
        this.setting.cycleFtp = min;
      } else if (inputValue > max) {
        this.setting.cycleFtp = max;
      } else {
        this.setting.cycleFtp = inputValue;
      }

      (e as any).target.value = this.setting.cycleFtp;
    } else {
      (e as any).target.value = this.userInfo.cycleFtp;
    }

    this.handleCountFtpZone();
  }

  /**
   * 變更使用單位
   * @param unit {Unit}-公制或英制
   * @author kidin-1100823
   */
  changeUnit(userUnit: Unit) {
    if (userUnit != this.setting.unit) {
      this.setting.unit = userUnit;
      const isMetric = userUnit === Unit.metric,
            { 
              strideLengthCentimeter,
              wheelSize,
              target: { distance, bodyWeight }
            } = this.setting;
      if (isMetric) {
        const { 
          strideLengthCentimeter: stepLenChange,
          wheelSize: wheelSizeChange,
          distance: distanceChange,
          bodyWeight: bodyWeightChange
        } = this.editFlag;

        // 判斷是否編輯該數值，避免連續切換單位設定造成數值因四捨五入而異動
        if (stepLenChange) {
          this.setting.strideLengthCentimeter = 
            valueConvert(strideLengthCentimeter, true, false, inch, 1);
        } else {
          this.setting.strideLengthCentimeter = this.userInfo.strideLengthCentimeter;
        }

        if (wheelSizeChange) {
          this.setting.wheelSize = valueConvert(wheelSize, true, false, wheelSizeCoefficient, 1);
        } else {
          this.setting.wheelSize = this.userInfo.wheelSize;
        }
        
        if (distanceChange) {
          this.setting.target.distance = valueConvert(distance, true, false, ft, 2);
        } else {
          this.setting.target.distance = this.userInfo.target.distance;
        }

        if (bodyWeightChange) {
          this.setting.target.bodyWeight = valueConvert(bodyWeight, true, false, ft, 2);
        } else {
          this.setting.target.bodyWeight = this.userInfo.target.bodyWeight;
        }
        
      } else {
        this.setting.strideLengthCentimeter = 
          valueConvert(strideLengthCentimeter, true, true, inch, 1);
        this.setting.wheelSize = valueConvert(wheelSize, true, true, wheelSizeCoefficient, 1);
        this.setting.target.distance = valueConvert(distance, true, true, ft, 2);
        this.setting.target.bodyWeight = valueConvert(bodyWeight, true, true, lb, 1);
      }

    }
    
  }

  /**
   * 變更慣用手
   * @param handedness {DominantHand.right | DominantHand.left}-慣用手
   * @author kidin-1100823
   */
  changeDominantHand(handedness: DominantHand.right | DominantHand.left) {
    this.setting.handedness = handedness;
  }

  /**
   * 變更步距
   * @param e {MouseEvent}
   * @author kidin-1100823
   */
  handleStepLenInput(e: MouseEvent) {
    const oldValue = this.userInfo.strideLengthCentimeter,
          inputValue = +(e as any).target.value,
          isMetric = this.setting.unit === Unit.metric,
          testFormat = formTest.decimalValue.test(`${inputValue}`),
          newValue = valueConvert(inputValue, !isMetric, false, inch, 1),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.strideLengthCentimeter = true;
      const min = 30,
            max = 255;
      if (newValue < min) {
        this.setting.strideLengthCentimeter = valueConvert(min, !isMetric, true, inch, 1);
      } else if (newValue > max) {
        this.setting.strideLengthCentimeter = valueConvert(max, !isMetric, true, inch, 1);
      } else {
        this.setting.strideLengthCentimeter = inputValue;
      }

      (e as any).target.value = this.setting.strideLengthCentimeter;
    } else {
      this.editFlag.strideLengthCentimeter = false;
      const { strideLengthCentimeter } = this.userInfo;
      (e as any).target.value = valueConvert(strideLengthCentimeter, !isMetric, true, inch, 1);
    }

  }

  /**
   * 變更腳踏車輪週長
   * @param e {MouseEvent}
   * @author kidin-1100823
   */
  handleWheelSizeInput(e: MouseEvent) {
    const oldValue = this.userInfo.wheelSize,
          inputValue = +(e as any).target.value,
          isMetric = this.setting.unit === Unit.metric,
          testFormat = formTest.decimalValue.test(`${inputValue}`),
          newValue = valueConvert(inputValue, !isMetric, false, wheelSizeCoefficient, 1),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.wheelSize = true;
      const min = 300,
            max = 9000;
      if (newValue < min) {
        this.setting.wheelSize = valueConvert(min, !isMetric, true, wheelSizeCoefficient, 1);
      } else if (newValue > max) {
        this.setting.wheelSize = valueConvert(max, !isMetric, true, wheelSizeCoefficient, 1);
      } else {
        this.setting.wheelSize = inputValue;
      }

      (e as any).target.value = this.setting.wheelSize;
    } else {
      this.editFlag.wheelSize = false;
      const { wheelSize } = this.userInfo;
      (e as any).target.value = valueConvert(wheelSize, !isMetric, true, wheelSizeCoefficient, 1);
    }

  }

  /**
   * 開關自動步數
   * @param act {AutoStepTarget}-關閉/開啟
   * @author kidin-1100824
   */
  changeAutoTargetStep(act: AutoStepTarget) {
    this.setting.autoTargetStep = act;
  }

  /**
   * 變更目標步數
   * @param e {MouseEvent}
   * @author kidin-1100824
   */
  handleTargetStepInput(e: MouseEvent) {
    const inputValue = +(e as any).target.value;
    if (inputValue && formTest.number.test(`${inputValue}`)) {
      const min = 100,
            max = 65535;
      if (inputValue < min) {
        this.setting.target.step = min;
      } else if (inputValue > max) {
        this.setting.target.step = max;
      } else {
        this.setting.target.step = inputValue;
      }

      (e as any).target.value = this.setting.target.step;
    } else {
      (e as any).target.value = this.userInfo.target.step;
    }

  }

  /**
   * 變更目標距離
   * @param e {MouseEvent}
   * @author kidin-1100824
   */
  handleTargetDistanceInput(e: MouseEvent) {
    const oldValue = this.userInfo.target.distance,
          inputValue = +(e as any).target.value,
          isMetric = this.setting.unit === Unit.metric,
          testFormat = formTest.decimalValue.test(`${inputValue}`),
          newValue = valueConvert(inputValue, !isMetric, false, ft, 2),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.distance = true;
      const max = 65535;
      if (newValue > max) {
        this.setting.target.distance = valueConvert(max, !isMetric, true, ft, 2);
      } else {
        this.setting.target.distance = inputValue;
      }

      (e as any).target.value = this.setting.target.distance;
    } else {
      this.editFlag.distance = false;
      const { distance } = this.userInfo.target;
      (e as any).target.value = valueConvert(distance, !isMetric, true, ft, 2);
    }

  }

  /**
   * 變更目標爬樓數
   * @param e {MouseEvent}
   * @author kidin-1100824
   */
  handleTargetElevGainInput(e: MouseEvent) {
    const inputValue = +(e as any).target.value;
    if (inputValue && formTest.number.test(`${inputValue}`)) {
      const max = 65535;
      if (inputValue > max) {
        this.setting.target.elevGain = max;
      } else {
        this.setting.target.elevGain = inputValue;
      }

      (e as any).target.value = this.setting.target.elevGain;
    } else {
      (e as any).target.value = this.userInfo.target.elevGain;
    }

  }

  /**
   * 變更目標卡路里
   * @param e {MouseEvent}
   * @author kidin-1100824
   */
  handleTargetCalorieInput(e: MouseEvent) {
    const inputValue = +(e as any).target.value;
    if (inputValue && formTest.number.test(`${inputValue}`)) {
      const min = 1300,
            max = 5000;
      if (inputValue < min) {
        this.setting.target.calorie = min;
      } else if (inputValue > max) {
        this.setting.target.calorie = max;
      } else {
        this.setting.target.calorie = inputValue;
      }

      (e as any).target.value = this.setting.target.calorie;
    } else {
      (e as any).target.value = this.userInfo.target.calorie;
    }

  }

  /**
   * 變更目標燃脂時間
   * @param e {MouseEvent}
   * @author kidin-1100824
   */
  handleTargetFitTimeInput(e: MouseEvent) {
    const oldValue = this.userInfo.target.fitTime,
          inputValue = +(e as any).target.value,
          testFormat = formTest.number.test(`${inputValue}`),
          newValue = mathRounding(inputValue * 60, 0),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      const min = 60,
            max = 64800;
      if (newValue < min) {
        this.setting.target.fitTime = mathRounding(min / 60, 0);
      } else if (newValue > max) {
        this.setting.target.fitTime = mathRounding(max / 60, 0);
      } else {
        this.setting.target.fitTime = inputValue;
      }

      (e as any).target.value = this.setting.target.fitTime;
    } else {
      const { fitTime } = this.userInfo.target;
      (e as any).target.value = mathRounding(fitTime / 60, 0);
    }

  }

  /**
   * 變更目標睡眠時間
   * @param e {MouseEvent}
   * @author kidin-1100824
   */
  handleTargetSleepInput(e: MouseEvent) {
    const oldValue = this.userInfo.target.sleep,
          inputValue = +(e as any).target.value,
          testFormat = formTest.decimalValue.test(`${inputValue}`),
          newValue = mathRounding(inputValue * 3600, 0),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      const min = 600,
            max = 64800;
      if (newValue < min) {
        this.setting.target.sleep = mathRounding(min / 3600, 1);
      } else if (newValue > max) {
        this.setting.target.sleep = mathRounding(max / 3600, 1);
      } else {
        this.setting.target.sleep = mathRounding(inputValue, 1);
      }

      (e as any).target.value = this.setting.target.sleep;
    } else {
      const { sleep } = this.userInfo.target;
      (e as any).target.value = mathRounding(sleep / 3600, 1);
    }

  }

  /**
   * 變更目標體重
   * @param e {MouseEvent}
   * @author kidin-1100823
   */
  handleTargetWeightInput(e: MouseEvent) {
    const oldValue = this.userInfo.target.bodyWeight,
          inputValue = +(e as any).target.value,
          isMetric = this.setting.unit === Unit.metric,
          testFormat = formTest.decimalValue.test(`${inputValue}`),
          newValue = valueConvert(inputValue, !isMetric, false, lb, 1),
          valueChanged = newValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      this.editFlag.bodyWeight = true;
      const min = 40,
            max = 255;
      if (newValue < min) {
        this.setting.target.bodyWeight = valueConvert(min, !isMetric, true, lb, 1);
      } else if (newValue > max) {
        this.setting.target.bodyWeight = valueConvert(max, !isMetric, true, lb, 1);
      } else {
        this.setting.target.bodyWeight = inputValue;
      }

      (e as any).target.value = this.setting.target.bodyWeight;
    } else {
      this.editFlag.bodyWeight = false;
      const { bodyWeight } = this.userInfo.target;
      (e as any).target.value = valueConvert(bodyWeight, !isMetric, true, lb, 1);
    }

  }

  /**
   * 變更目標肌肉率
   * @param e {MouseEvent}
   * @author kidin-1100823
   */
  handleTargetMuscleRateInput(e: MouseEvent) {
    const oldValue = this.userInfo.target.muscleRate,
          inputValue = +(e as any).target.value,
          testFormat = formTest.decimalValue.test(`${inputValue}`),
          valueChanged = inputValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      const min = 5,
            max = 50;
      if (inputValue < min) {
        this.setting.target.muscleRate = min;
      } else if (inputValue > max) {
        this.setting.target.muscleRate = max;
      } else {
        this.setting.target.muscleRate = inputValue;
      }

      (e as any).target.value = this.setting.target.muscleRate;
    } else {
      (e as any).target.value = this.userInfo.target.muscleRate;
    }

  }

  /**
   * 變更目標體脂率
   * @param e {MouseEvent}
   * @author kidin-1100823
   */
  handleTargetFatRateInput(e: MouseEvent) {
    const oldValue = this.userInfo.target.fatRate,
          inputValue = +(e as any).target.value,
          testFormat = formTest.decimalValue.test(`${inputValue}`),
          valueChanged = inputValue !== oldValue;
    if (inputValue && testFormat && valueChanged) {
      const min = 5,
            max = 50;
      if (inputValue < min) {
        this.setting.target.fatRate = min;
      } else if (inputValue > max) {
        this.setting.target.fatRate = max;
      } else {
        this.setting.target.fatRate = inputValue;
      }

      (e as any).target.value = this.setting.target.fatRate;
    } else {
      (e as any).target.value = this.userInfo.target.fatRate;
    }

  }

  /**
   * 開啟時間選擇器
   * @param e {keyboardEvent}
   * @param type {'normalBedTime' | 'normalWakeTime'}-欲變更的時間類別
   * @author kidin-1100830
   */
  openTimeSelector(e: KeyboardEvent, type: 'normalBedTime' | 'normalWakeTime') {
    e.stopPropagation();
    const [hour, min, second] = this.setting[type].split(':'),
          hourList = [],
          minList = [];
    for (let i = -4; i <= 4; i++) {
      const _hour = +hour + i,
            _min = +min + i;
      hourList.push(this.timeCheck(_hour, 'hour'));
      minList.push(this.timeCheck(_min, 'min'));
    }

    this.timeSelector = {
      hour,
      min,
      hourList,
      minList
    };

    this.uiFlag.showTimeSelector = type;
    setTimeout(() => {
      const hourEl = document.getElementById('hour__selector'),
            minEl = document.getElementById('min__selector');
      this.subscribeWheelEvent(hourEl, minEl);
      this.subscribeGlobalClick();
    });
    
  }

  /**
   * 檢查小時或分鐘是否超出範圍值(24小時制)
   * @param value {number}-小時或分鐘
   * @param max {number}-最大值
   * @returns {string}-小時或分鐘（有補零）
   */
  timeCheck(value: number, type: TimeEditType): string {
    const max = type === 'hour' ? 24 : 60;
    if (value < 0) {
      return (`${value + max}`.padStart(2, '0'));
    } else if (value >= max) {
      return (`${value - max}`.padStart(2, '0'));
    } else {
      return (`${value}`.padStart(2, '0'));
    }

  }

  /**
   * 訂閱滑鼠滾輪事件
   * @param hourEl {Element}-小時選擇器
   * @param minEl {Element}-分鐘選擇器
   * @author kidin-1100830
   */
  subscribeWheelEvent(hourEl: Element, minEl: Element) {
    const hourWheelEvent = fromEvent(hourEl, 'wheel'),
          minWheelEvent = fromEvent(minEl, 'wheel');
    this.wheelEvent = merge(hourWheelEvent, minWheelEvent).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      e.preventDefault();
      // 避免正在校正數值與位置時又觸發滾輪事件
      if (!this.uiFlag.valueShifting) {
        this.uiFlag.valueShifting = true;
        const ttlShift = 25,  // 數字偏移量
              animationTime = 25,  // 總偏移時間
              interval = 5,  // 偏移間隔時間
              { deltaY, currentTarget } = e as any,
              { id, style: { top } } = currentTarget,
              topVal = +top.split('px')[0],
              timeType = id.split('__')[0],  // hour或min
              ref = `${timeType}List`;  // hourList或minList
        let refList = this.timeSelector[ref],
            start = 0;
        const animation = setInterval(() => {
          start += interval;
          if (start >= animationTime) {
            // 將位置校正回來
            if (deltaY > 0) {
              const lastVal = refList[refList.length - 1],
                    newVal = this.timeCheck(+lastVal + 1, timeType);
              refList.push(newVal);
              refList.shift();
            } else {
              const firstVal = refList[0],
                    newVal = this.timeCheck(+firstVal - 1, timeType);
              refList.unshift(newVal);
              refList.pop();
            }
            
            currentTarget.style.top = `${topVal}px`;
            clearInterval(animation);
            this.uiFlag.valueShifting = false;
          } else {
            const shift = ttlShift * (start / animationTime);
            if (deltaY > 0) {
              currentTarget.style.top = `${topVal - shift}px`;
            } else {
              currentTarget.style.top = `${topVal + shift}px`;
            }

          }

        }, interval);

      }

    });

  }

  /**
   * 從手機變更時間
   * @param e {Event}
   * @author kidin-1100830
   */
  changeTime(e: Event, type: 'normalBedTime' | 'normalWakeTime') {
    const { value } = (e as any).target;
    this.setting[type] = `${value}:00`;
  }

  /**
   * 訂閱全域點擊事件
   * @author kidin-1100830
   */
  subscribeGlobalClick() {
    const clickEvent = fromEvent(document, 'click');
    this.clickEvent = clickEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.closeTimeSelector();
      this.unsubscribeEvent();
    });

  }

  /**
   * 關閉時間選擇器
   * @author kidin-1100830
   */
  closeTimeSelector() {
    this.uiFlag.showTimeSelector = null;
  }

  /**
   * 取消訂閱事件
   */
  unsubscribeEvent() {
    if (this.clickEvent) this.clickEvent.unsubscribe();
    if (this.wheelEvent) this.wheelEvent.unsubscribe();
    if (this.touchEvent) this.touchEvent.unsubscribe();
  }

  /**
   * 選擇時間
   * @param e {MouseEvent}
   * @param type {TimeEditType}-時間單位類別
   * @param value {string}-所選時間
   * @author kidin-1100830
   */
  selectTime(e: MouseEvent, type: TimeEditType, value: string) {
    e.stopPropagation();
    this.timeSelector[type] = value;
    const { showTimeSelector } = this.uiFlag,
          { hour, min } = this.timeSelector;
    this.setting[showTimeSelector] = `${hour}:${min}:00`;
  }

  /**
   * 展開或收合整個帳號資訊內容
   * @author kidin-1100922
   */
  handleFolder() {
    this.uiFlag.expand = !this.uiFlag.expand;
  }

  /**
   * 計算心率區間
   * @author kidin-1100923
   */
  handleCountHrZone() {
    const { birthday } = this.userInfo,
          { heartRateBase, heartRateMax, heartRateResting } = this.setting,
          age = dayjs().diff(dayjs(birthday, 'YYYYMMDD'), 'year');
    this.userHrZone = getUserHrRange(heartRateBase, age, heartRateMax, heartRateResting);
  }

  /**
   * 計算閾值區間
   * @author kidin-1100923
   */
  handleCountFtpZone() {
    const { cycleFtp } = this.setting;
    this.userFtpZone = getUserFtpZone(cycleFtp);
  }

  /**
   * 點擊彈跳框時，若開啟時間選擇器，則關閉時間選擇器
   * @param e {KeyboardEvent}
   * @author kidin-1100923
   */
  handleClickDialog(e: KeyboardEvent) {
    e.stopPropagation();
    this.closeTimeSelector();
  }

  /**
   * 展開/收合日期計算基準清單
   * @param e {MouseEvent}
   */
  toggleCycleList(e: MouseEvent) {
    e.stopPropagation();
    const { showCycleList } = this.uiFlag;
    showCycleList ? this.foldCycleList() : this.unfoldCycleList();
  }

  /**
   * 展開日期計算基準清單
   */
  unfoldCycleList() {
    this.foldAllList();
    this.uiFlag.showCycleList = true;
    this.subscribeDialogClickEvent();
  }

  /**
   * 收合日期計算基準清單
   */
  foldCycleList() {
    this.uiFlag.showCycleList = false;
    this.unsubscribeEvent();
  }

  /**
   * 選擇目標條件之日期基準
   * @param cycle {DateUnit}-指定的基準序位
   */
  selectDateCycle(cycle: DateUnit) {
    this.sportsTarget.cycle = cycle;
    this.foldCycleList();
  }

  /**
   * 展開/收合目標條件名稱清單
   * @param e {MouseEvent}
   */
  toggleFiledNameList(e: MouseEvent) {
    e.stopPropagation();
    const { showFiledNameList } = this.uiFlag;
    showFiledNameList ? this.foldFiledNameList() : this.unfoldFiledNameList();
  }

  /**
   * 展開目標條件名稱清單
   */
  unfoldFiledNameList() {
    this.foldAllList();
    this.uiFlag.showFiledNameList = true;
    this.subscribeDialogClickEvent();
  }

  /**
   * 收合目標條件名稱
   */
  foldFiledNameList() {
    this.uiFlag.showFiledNameList = false;
    this.unsubscribeEvent();
  }

  /**
   * 選擇新的條件名稱
   * @param field {TargetField}
   */
  selectNewConditionFiled(field: TargetField) {
    this.newCondition.filedName = field;
    const { filedValue } = this.newCondition;
    if (filedValue) {
      
      if (field.toLowerCase().includes('time')) {
        this.newCondition.filedValue = filedValue * 60;
      }
      
      this.addNewCondition();
    }

    this.foldFiledNameList();
  }

  /**
   * 設定目標條件之達成值
   * @param e {MouseEvent}
   */
  setNewConditionValue(e: MouseEvent) {
    const { value } = (e as any).target;
    if (formTest.number.test(value)) {
      this.newCondition.filedValue = +value;
      const { filedName, filedValue } = this.newCondition;
      if (filedName) {
        // 若目標項目跟時間有關，則將數值由分轉為秒
        if (filedName.toLocaleLowerCase().includes('time')) {
          this.newCondition.filedValue = filedValue * 60;
        }

        this.addNewCondition();
      }

    }

    (e as any).target.value = '';
  }

  /**
   * 將設定好的新條件納入目標中，若條件名稱重複則覆蓋舊條件
   */
  addNewCondition() {
    const { filedName } = this.newCondition;
    const repeatIndex = this.sportsTarget.condition
      .findIndex(_condition => _condition.filedName === filedName);
    
    if (repeatIndex >= 0) this.deleteCondition(repeatIndex);
    const newCondition = deepCopy(this.newCondition);
    this.sportsTarget.condition.push(newCondition);
    this.newCondition = {
      filedName: <TargetField>'',
      symbols: ConditionSymbols.greaterEqual,
      filedValue: null
    };

  }

  /**
   * 移除指定之條件
   * @param index {number}-條件序列
   */
  deleteCondition(index: number) {
    this.sportsTarget.condition.splice(index, 1);
  }

  /**
   * 將所有已顯示清單收合
   * @author kidin-1110308
   */
  foldAllList() {
    this.uiFlag.showCycleList = false;
    this.uiFlag.showFiledNameList = false;
  }

  /**
   * 訂閱彈跳設定視窗點擊事件
   */
  subscribeDialogClickEvent() {
    const element = document.querySelector('.dialog-box');
    const clickEvent = fromEvent(element, 'click');
    this.dialogClickEvent = clickEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.foldAllList();
      this.unsubscribeDialogClickEvent();
    });

  }

  /**
   * 取消訂閱彈跳設定視窗點擊事件
   */
  unsubscribeDialogClickEvent() {
    this.dialogClickEvent.unsubscribe();
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }  

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { deepCopy } from '../../../../shared/utils/index';
import { Router } from '@angular/router';
import { appPath } from '../../../../app-path.const';

type Axis = 'x' | 'y' | 'z';

enum WavePosition {
  top,
  center,
  bottom,
}

interface WaveInfo {
  startTime: number;
  endTime: number;
  top: {
    value: number;
    time: number;
  };
  bottom: {
    value: number;
    time: number;
  };
}

/**
 * 預設設定參數
 */
const defaultOption = {
  /**
   * 波形有效最低2倍振幅
   * 即一個有效重訓動作，最高與最低加速度差之最低值
   */
  minAmplitude: 5,

  /**
   * 振幅門檻係數
   * 用來獲取有效的重訓波形
   */
  waveAmplitudeThreshold: 1 / 3,

  /**
   * 波形有效最低時間(秒)（波長）
   * 即一個有效重訓動作至少需花費的毫秒
   */
  minWaveTime: 400,

  /**
   * 最大取樣振幅
   */
  maxAmplitude: 40,
};

@Component({
  selector: 'app-gsensor',
  templateUrl: './gsensor.component.html',
  styleUrls: ['./gsensor.component.scss'],
})
export class GsensorComponent implements OnInit, OnDestroy {
  ngUnsubscribe = new Subject();
  deviceMotionSubscription = new Subscription();

  /**
   * 是否支援取得手機內建感應器數據
   */
  notSupportDeviceMotion = true;

  /**
   * 是否完成一個組數
   */
  setFinished = false;

  /**
   * 重訓次數設定
   */
  repsTarget = 10;

  /**
   * 波形範圍，用來判斷有效波形
   */
  waveRange = {
    x: new WaveRange(),
    y: new WaveRange(),
    z: new WaveRange(),
  };

  /**
   * 將最新的波形先暫存
   */
  tempWave = {
    x: new OneWave(),
    y: new OneWave(),
    z: new OneWave(),
  };

  /**
   * 所有有效的波形紀錄
   */
  allRecord = {
    x: <Array<WaveInfo>>[],
    y: <Array<WaveInfo>>[],
    z: <Array<WaveInfo>>[],
  };

  /**
   * 螢幕喚醒鎖
   */
  wakeLock: any = null;

  /**
   * 計時器
   */
  timer: NodeJS.Timer;

  /**
   * 訓練時間
   */
  trainingTime = 0;

  /**
   * 總共接到感應器的數值數目
   */
  totalPoint = 0;

  /**
   * 紀錄波動作為順向開始或逆向開始
   * 用來判斷動作是否完整做完還是做到一半
   */
  startMotionIsForward = {
    x: <boolean | null>null,
    y: <boolean | null>null,
    z: <boolean | null>null,
  };

  constructor(private router: Router) {}

  /**
   * 元件初始化
   */
  ngOnInit(): void {
    this.checkDomain();
    this.checkSupport();
    this.setTimer();
    this.screenWake();
    this.subscribeDeviceMotionEvent();
  }

  /**
   * 若為正式環境，則導向404頁面
   */
  checkDomain() {
    if (location.host === 'www.gptfit.com') {
      this.router.navigateByUrl(appPath.pageNotFound);
    }
  }

  /**
   * 確認是否支援手機內建感應器與藍芽連線
   */
  checkSupport() {
    this.notSupportDeviceMotion = window.ondevicemotion === undefined;
  }

  /**
   * 設定計時器
   */
  setTimer() {
    const resolutionTime = 10;
    this.timer = setInterval(() => {
      if (!this.setFinished) this.trainingTime += resolutionTime;
    }, resolutionTime);
  }

  /**
   * 螢幕喚醒
   */
  screenWake() {
    // 1. 首先看是否支援，有存在這個 API 就代表支援
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((wakeLock) => {
        this.wakeLock = wakeLock;
      });
    }
  }

  /**
   * 訂閱晃動事件
   */
  subscribeDeviceMotionEvent() {
    const deviceMotionEvent = fromEvent(window, 'devicemotion');
    this.deviceMotionSubscription = deviceMotionEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        // 確認是否已完成這組重訓動作
        if (!this.setFinished) {
          const { trainingTime } = this;
          const {
            accelerationIncludingGravity: { x, y, z },
          } = e as any;
          this.handleValue('x', x, trainingTime);
          this.handleValue('y', y, trainingTime);
          this.handleValue('z', z, trainingTime);
          this.totalPoint++;
        }
      });
  }

  /**
   * 解除訂閱晃動事件
   */
  unsubscribeDeviceMotionEvent() {
    if (this.deviceMotionSubscription) this.deviceMotionSubscription.unsubscribe();
  }

  /**
   * 將數值進行處理
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   * @param time {time}-目前訓練總計時
   */
  handleValue(axis: Axis, value: number, time: number) {
    this.checkOverPeak(axis, value, time);
    this.checkWave(axis, value);
    this.recordInfo(axis, value, time);
  }

  /**
   * 確認數值是否超出之前的波峰，超出則更新波峰數值
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   * @param time {time}-目前訓練總計時
   */
  checkOverPeak(axis: Axis, value: number, time: number) {
    const { totalPoint } = this;
    const { peakTop, peakBottom } = this.waveRange[axis];

    if (totalPoint === 0) {
      this.waveRange[axis].peakTop = value;
      this.waveRange[axis].peakBottom = value;
      this.tempWave[axis].waveStartTime = time;
      return;
    }

    if (value > peakTop) this.waveRange[axis].peakTop = value;
    if (value < peakBottom) this.waveRange[axis].peakBottom = value;
  }

  /**
   * 判斷數值進入哪個區域後，
   * 確認目前波形是進入新的一個重訓動作還是回程動作
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   */
  checkWave(axis: Axis, value: number) {
    const startMotionIsForward = this.startMotionIsForward[axis];
    const { waveTopTime, waveBottomTime, waveToBe } = this.tempWave[axis];
    const currentPosition = this.waveRange[axis].getWavePosition(value);
    switch (currentPosition) {
      case WavePosition.top:
        if (startMotionIsForward === null) this.startMotionIsForward[axis] = true;

        // 如果是反向動作且尚未紀錄到波谷資訊，代表為重訓回程動作
        if (waveToBe) {
          if (startMotionIsForward === false && !waveBottomTime) {
            this.tempWave[axis].loadPreviousRecord();
          } else {
            this.saveWave(axis);
          }
        }
        break;
      case WavePosition.bottom:
        if (startMotionIsForward === null) this.startMotionIsForward[axis] = false;

        // 如果是正向動作且尚未紀錄到波峰資訊，代表為重訓回程動作
        if (waveToBe) {
          if (startMotionIsForward === true && !waveTopTime) {
            this.tempWave[axis].loadPreviousRecord();
          } else {
            this.saveWave(axis);
          }
        }

        break;
      default:
        break;
    }
  }

  /**
   * 判斷數值進入哪個區域
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   * @param time {time}-目前訓練總計時
   */
  recordInfo(axis: Axis, value: number, time: number) {
    const { waveTopValue, waveBottomValue, waveTopTime, waveBottomTime, waveStartTime } =
      this.tempWave[axis];

    // 第一個point先視為中心點，以及第一個波形起始點
    if (this.totalPoint === 0 && !waveStartTime) {
      this.tempWave[axis].waveStartTime = time;
      return;
    }

    const currentPosition = this.waveRange[axis].getWavePosition(value);
    switch (currentPosition) {
      case WavePosition.top:
        // 只紀錄該波形波峰最高值與時間
        if (waveStartTime && (!waveTopValue || value > waveTopValue)) {
          this.tempWave[axis].waveTopValue = value;
          this.tempWave[axis].waveTopTime = time;
        }
        break;
      case WavePosition.bottom:
        // 只紀錄該波形波谷最低值與時間
        if (waveStartTime && (!waveBottomValue || value < waveBottomValue)) {
          this.tempWave[axis].waveBottomValue = value;
          this.tempWave[axis].waveBottomTime = time;
        }
        break;
      case WavePosition.center:
        // 僅以波回到中心位置做為波形開始與結束
        if (!waveStartTime || (!waveTopTime && !waveBottomTime))
          this.tempWave[axis].waveStartTime = time;
        if (waveStartTime && waveTopTime && waveBottomTime) this.tempWave[axis].waveEndTime = time;
        break;
    }

    if (this.tempWave[axis].waveEndTime) this.saveWaveToBe(axis);
  }

  /**
   * 確認波形是否符合正常重訓動作的波形後，將波形暫存
   * @param axis {Axis}-軸線類別
   */
  saveWaveToBe(axis: Axis) {
    const { minWaveTime, minAmplitude } = defaultOption;
    const { waveTime, doubleAmplitude } = this.tempWave[axis];
    const timeTooShort = waveTime < minWaveTime;
    const amplitudeTooSmall = doubleAmplitude < minAmplitude;

    // 波長過短或振幅過小視為無效波
    if (timeTooShort || amplitudeTooSmall) {
      return this.tempWave[axis].init();
    }

    this.tempWave[axis].saveWaveToBe();

    // 確認暫存波形是否為最後一下，如果為最後一下則視為訓練結束
    const { repsTarget, allRecord } = this;
    const currentRecordLength = allRecord[axis].length;
    if (currentRecordLength >= repsTarget - 1) this.saveWave(axis);
    return this.tempWave[axis].init();
  }

  /**
   * 將波形納入正式次數中
   * @param axis {Axis}-軸線類別
   */
  saveWave(axis: Axis) {
    const { waveToBe } = this.tempWave[axis];
    const {
      top: { value: topValue },
      bottom: { value: bottomValue },
    } = waveToBe;
    const doubleAmplitude = topValue - bottomValue;
    this.allRecord[axis].push(waveToBe);
    this.tempWave[axis].clearWaveToBe();
    this.handleRangeChange(axis, doubleAmplitude);
  }

  /**
   * 若最大值或最小值異動，則變更各區間有效範圍，並回溯檢視各波形
   * @param axis {Axis}-軸線
   * @param doubleAmplitude {number}-兩倍振幅
   */
  handleRangeChange(axis: Axis, doubleAmplitude: number) {
    const { effectAmplitude } = this.waveRange[axis];
    if (doubleAmplitude > effectAmplitude) {
      this.waveRange[axis].effectAmplitude = doubleAmplitude;
      this.traceBackWave(axis);
    }
  }

  /**
   * 回溯檢查之前的波形是否符合最新獲取之波形
   * @param axis {Axis}-軸線類別
   */
  traceBackWave(axis: Axis) {
    const { waveAmplitudeThreshold } = defaultOption;
    const { effectAmplitude } = this.waveRange[axis];
    this.allRecord[axis] = this.allRecord[axis].filter((_record) => {
      const {
        top: { value: topValue },
        bottom: { value: bottomValue },
      } = _record;
      return topValue - bottomValue > effectAmplitude * waveAmplitudeThreshold;
    });
  }

  /**
   * 以三軸中波形範圍最大者判斷為主要參考次數
   */
  getCount() {
    const effectAmplitudeX = this.waveRange.x.effectAmplitude;
    const effectAmplitudeY = this.waveRange.y.effectAmplitude;
    const effectAmplitudeZ = this.waveRange.z.effectAmplitude;
    const amplitudeArray = [
      ['x', effectAmplitudeX],
      ['y', effectAmplitudeY],
      ['z', effectAmplitudeZ],
    ];
    const [axis] = amplitudeArray.sort((a: Array<any>, b: Array<any>) => b[1] - a[1])[0];
    const referenceLength = this.allRecord[axis].length;
    if (referenceLength >= this.repsTarget) this.setFinished = true;
    return this.allRecord[axis].length;
  }

  /**
   * 初始化（歸零）
   */
  reset() {
    this.setFinished = false;
    this.trainingTime = 0;
    this.totalPoint = 0;

    this.allRecord = {
      x: [],
      y: [],
      z: [],
    };

    this.startMotionIsForward = {
      x: null,
      y: null,
      z: null,
    };

    this.waveRange.x.init();
    this.waveRange.y.init();
    this.waveRange.z.init();
  }

  /**
   * 將紀錄物件轉為字串
   * @param axis {Axis}
   */
  stringify(axis: Axis) {
    return JSON.stringify(this.allRecord[axis]);
  }

  /**
   * 解除訂閱rxjs與計時器
   */
  ngOnDestroy(): void {
    this.unsubscribeDeviceMotionEvent();
    if (this.timer) clearInterval(this.timer);
    if (this.wakeLock && this.wakeLock.release) this.wakeLock.release();
    if (this.wakeLock) this.wakeLock = null;
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}

/**
 * 單一波形資訊
 */
class OneWave {
  private _waveTopValue: number | null = null;
  private _waveBottomValue: number | null = null;
  private _waveStartTime: number | null = null;
  private _waveTopTime: number | null = null;
  private _waveBottomTime: number | null = null;
  private _waveEndTime: number | null = null;

  /**
   * 將最新的波形先佔存
   * 確認下一個波形為並非回程動作時
   * 再計入次數中
   */
  private _waveToBe: WaveInfo | null = null;

  /**
   * 初始化變數
   */
  init() {
    this._waveTopValue = null;
    this._waveBottomValue = null;
    this._waveStartTime = null;
    this._waveTopTime = null;
    this._waveBottomTime = null;
    this._waveEndTime = null;
  }

  /**
   * 將之前暫存的波形寫回，以便更新該筆紀錄
   */
  loadPreviousRecord() {
    const {
      startTime,
      top: { value: topValue, time: topTime },
      bottom: { value: bottomValue, time: bottomTime },
    } = this._waveToBe as WaveInfo;

    this._waveTopValue = topValue;
    this._waveBottomValue = bottomValue;
    this._waveStartTime = startTime;
    this._waveTopTime = topTime;
    this._waveBottomTime = bottomTime;
    this._waveEndTime = null; // 重load代表該動作尚未結束
    this.clearWaveToBe();
  }

  /**
   * 儲存波峰值
   * @param value {number | null}-波峰值
   */
  set waveTopValue(value: number | null) {
    this._waveTopValue = value;
  }

  /**
   * 取得波峰值
   */
  get waveTopValue() {
    return this._waveTopValue;
  }

  /**
   * 儲存波谷值
   * @param value {number | null}-波峰值
   */
  set waveBottomValue(value: number | null) {
    this._waveBottomValue = value;
  }

  /**
   * 取得波谷值
   */
  get waveBottomValue() {
    return this._waveBottomValue;
  }

  /**
   * 儲存此波開始時間點
   * @param time {number | null}-開始時間點
   */
  set waveStartTime(time: number | null) {
    this._waveStartTime = time;
  }

  /**
   * 取得此波開始時間點
   */
  get waveStartTime() {
    return this._waveStartTime;
  }

  /**
   * 儲存波峰時間點
   * @param time {number | null}-波峰值
   */
  set waveTopTime(time: number | null) {
    this._waveTopTime = time;
  }

  /**
   * 取得波峰時間點
   */
  get waveTopTime() {
    return this._waveTopTime;
  }

  /**
   * 儲存波谷時間點
   * @param time {number | null}-波峰值
   */
  set waveBottomTime(time: number | null) {
    this._waveBottomTime = time;
  }

  /**
   * 取得波谷時間點
   */
  get waveBottomTime() {
    return this._waveBottomTime;
  }

  /**
   * 儲存此波結束時間點
   * @param time {number | null}-波峰值
   */
  set waveEndTime(time: number | null) {
    this._waveEndTime = time;
  }

  /**
   * 取得此波結束時間點
   */
  get waveEndTime() {
    return this._waveEndTime;
  }

  /**
   * 取得兩倍振幅
   */
  get doubleAmplitude() {
    const { _waveTopValue, _waveBottomValue } = this;
    return (_waveTopValue || 0) - (_waveBottomValue || 0);
  }

  /**
   * 取得此波形歷經時間(波長)
   */
  get waveTime() {
    const { _waveStartTime, _waveEndTime } = this;
    return (_waveEndTime || 0) - (_waveStartTime || 0);
  }

  /**
   * 取得此波概要資訊
   */
  get waveInfo(): WaveInfo {
    const {
      _waveTopValue,
      _waveBottomValue,
      _waveStartTime,
      _waveTopTime,
      _waveBottomTime,
      _waveEndTime,
    } = this;

    return {
      startTime: _waveStartTime as number,
      endTime: _waveEndTime as number,
      top: {
        value: _waveTopValue as number,
        time: _waveTopTime as number,
      },
      bottom: {
        value: _waveBottomValue as number,
        time: _waveBottomTime as number,
      },
    };
  }

  /**
   * 清空波形暫存
   */
  clearWaveToBe() {
    this._waveToBe = null;
  }

  /**
   * 將波形暫存
   */
  saveWaveToBe() {
    this._waveToBe = this.waveInfo;
    this.init();
  }

  /**
   * 取得暫存波型
   */
  get waveToBe() {
    return this._waveToBe ? deepCopy(this._waveToBe) : this._waveToBe;
  }
}

/**
 * 用來判斷是否為採樣波形
 */
class WaveRange {
  private _peakTop: number | null = null;
  private _peakBottm: number | null = null;
  private _effectAmplitude = defaultOption.minAmplitude;

  /**
   * 初始化範圍
   */
  init() {
    this._peakTop = null;
    this._peakBottm = null;
    this._effectAmplitude = defaultOption.minAmplitude;
  }

  /**
   * 儲存最高波峰值
   * @param accelerationValue {number}-目前加速度
   */
  set peakTop(accelerationValue: number) {
    this._peakTop = accelerationValue;
  }

  /**
   * 取得最高波峰值
   */
  get peakTop() {
    return this._peakTop || 0;
  }

  /**
   * 儲存最低波峰值
   * @param accelerationValue {number}-目前加速度
   */
  set peakBottom(accelerationValue: number) {
    this._peakBottm = accelerationValue;
  }

  /**
   * 取得最低波峰值
   */
  get peakBottom() {
    return this._peakBottm || 0;
  }

  /**
   * 儲存有效振幅值
   * @param accelerationValue {number}-目前加速度
   */
  set effectAmplitude(accelerationValue: number) {
    const { maxAmplitude } = defaultOption;
    this._effectAmplitude = accelerationValue > maxAmplitude ? maxAmplitude : accelerationValue;
  }

  /**
   * 取得有效振幅值
   */
  get effectAmplitude() {
    return this._effectAmplitude;
  }

  /**
   * 取得波形y軸中心點
   */
  get waveCenter() {
    const { _peakTop, _peakBottm } = this;
    return ((_peakTop || 0) + (_peakBottm || 0)) / 2;
  }

  /**
   * 取得波形最大範圍
   */
  get range() {
    const { _peakTop, _peakBottm } = this;
    return (_peakTop || 0) - (_peakBottm || 0);
  }

  /**
   * 取得目前加速度值位於波形的位置
   * @param accelerationValue {number}-目前加速度
   */
  getWavePosition(accelerationValue: number) {
    const { waveCenter, _effectAmplitude } = this;
    const { waveAmplitudeThreshold } = defaultOption;
    const threshold = _effectAmplitude * waveAmplitudeThreshold * 0.5; // 上下波形原點區間門檻值
    const centerTop = waveCenter + threshold;
    const centerBottom = waveCenter - threshold;
    if (accelerationValue > centerTop) return WavePosition.top;
    if (accelerationValue < centerBottom) return WavePosition.bottom;
    return WavePosition.center;
  }
}

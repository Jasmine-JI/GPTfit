import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { takeUntil, filter, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { appPath } from '../../../../app-path.const';
import { chart } from 'highcharts';

type Axis = 'x' | 'y' | 'z';

enum WavePosition {
  top,
  center,
  bottom,
}

type SamplingChartRecord = Array<[number, number]>;

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
  waveAmplitudeThreshold: 1 / 2,

  /**
   * 波形有效最低時間(秒)（波長）
   * 即一個有效重訓動作至少需花費的毫秒
   */
  minWaveTime: 400,

  /**
   * 最大取樣振幅
   */
  maxAmplitude: 20,

  /**
   * 取樣率(筆/毫秒)
   */
  samplingRate: 52 / 1000,
};

@Component({
  selector: 'app-gsensor',
  templateUrl: './gsensor.component.html',
  styleUrls: ['./gsensor.component.scss'],
})
export class GsensorComponent implements OnInit, OnDestroy {
  @ViewChild('xChart') xChart: ElementRef;
  @ViewChild('yChart') yChart: ElementRef;
  @ViewChild('zChart') zChart: ElementRef;
  @ViewChild('xOChart') xOChart: ElementRef;
  @ViewChild('yOChart') yOChart: ElementRef;
  @ViewChild('zOChart') zOChart: ElementRef;

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
  repsTarget = 20;

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
   * 取樣率
   */
  samplingRate = defaultOption.samplingRate;

  /**
   * 完整波形紀錄
   */
  samplingRecord = {
    x: <SamplingChartRecord>[],
    y: <SamplingChartRecord>[],
    z: <SamplingChartRecord>[],
  };

  /**
   * 完整波形紀錄
   */
  samplingOriginRecord = {
    x: <SamplingChartRecord>[],
    y: <SamplingChartRecord>[],
    z: <SamplingChartRecord>[],
  };

  /**
   * 紀錄上一點頂點是位於波峰或波谷(僅初始值紀錄為中心位置)
   */
  prevPeakPosition = {
    x: <WavePosition>WavePosition.center,
    y: <WavePosition>WavePosition.center,
    z: <WavePosition>WavePosition.center,
  };

  /**
   * 前一點資訊（用來平滑化）
   */
  prevPoint = {
    x: { value: <number | null>null, time: 0 },
    y: { value: <number | null>null, time: 0 },
    z: { value: <number | null>null, time: 0 },
  };

  /**
   * 重訓次數結果
   */
  resultCount = 0;

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
      .pipe(
        filter(() => !this.setFinished), // 確認是否已完成這組重訓動作
        filter(() => this.totalPoint / this.trainingTime < +this.samplingRate),
        tap((e) => this.chartDataOriginRecord(e)),
        map((e) => this.smoothValue(e)),
        tap((e) => this.chartDataRecord(e)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((e) => {
        const { trainingTime } = this;
        const {
          accelerationIncludingGravity: { x, y, z },
        } = e as any;
        this.handleValue('x', x, trainingTime);
        this.handleValue('y', y, trainingTime);
        this.handleValue('z', z, trainingTime);
        this.totalPoint++;
      });
  }

  /**
   * 與前一點進行比較並平滑化
   * @param e {any}-晃動事件
   */
  smoothValue(e: any) {
    const { trainingTime } = this;
    const {
      accelerationIncludingGravity: { x, y, z },
    } = e;

    const newEventValue = {
      accelerationIncludingGravity: {
        x: 0,
        y: 0,
        z: 0,
      },
    };
    newEventValue.accelerationIncludingGravity.x = this.smoothValueByAxis('x', x, trainingTime);
    newEventValue.accelerationIncludingGravity.y = this.smoothValueByAxis('y', y, trainingTime);
    newEventValue.accelerationIncludingGravity.z = this.smoothValueByAxis('z', z, trainingTime);
    return newEventValue;
  }

  /**
   * 將數值差異過大的點進行平滑化
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   * @param time {time}-目前訓練總計時
   */
  smoothValueByAxis(axis: Axis, value: number, time: number) {
    const prevValue = this.prevPoint[axis].value as number;
    const prevTime = this.prevPoint[axis].time;
    if (!prevTime) {
      this.prevPoint[axis] = { value, time };
      return value;
    }

    const maxSlope = 0.025; // 兩點最大斜率（加速度/時間）
    const valueDiff = value - prevValue;
    const timeDiff = time - prevTime;
    const absSlope = Math.abs(valueDiff / timeDiff);
    if (absSlope > maxSlope) {
      const fixSlope = valueDiff > 0 ? maxSlope : -maxSlope;
      const fixedValue = prevValue + timeDiff * fixSlope;
      this.prevPoint[axis] = { value: fixedValue, time };
      return fixedValue;
    } else {
      this.prevPoint[axis] = { value, time };
      return value;
    }
  }

  /**
   * 紀錄圖表數據
   * @param e {MotionEvent}
   */
  chartDataRecord(e: any) {
    if (this.setFinished) return;
    const { trainingTime, samplingRate } = this;
    const currentLength = this.samplingRecord.x.length;
    if (currentLength / trainingTime < samplingRate) {
      const {
        accelerationIncludingGravity: { x, y, z },
      } = e as any;

      this.samplingRecord.x.push([trainingTime, x]);
      this.samplingRecord.y.push([trainingTime, y]);
      this.samplingRecord.z.push([trainingTime, z]);
    }
  }

  /**
   * 紀錄圖表數據
   * @param e {MotionEvent}
   */
  chartDataOriginRecord(e: any) {
    if (this.setFinished) return;
    const { trainingTime, samplingRate } = this;
    const currentLength = this.samplingOriginRecord.x.length;
    if (currentLength / trainingTime < samplingRate) {
      const {
        accelerationIncludingGravity: { x, y, z },
      } = e as any;

      this.samplingOriginRecord.x.push([trainingTime, x]);
      this.samplingOriginRecord.y.push([trainingTime, y]);
      this.samplingOriginRecord.z.push([trainingTime, z]);
    }
  }

  /**
   * 將數值進行處理
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   * @param time {time}-目前訓練總計時
   */
  handleValue(axis: Axis, value: number, time: number) {
    if (this.totalPoint === 0) this.handleFirstPoint(axis, value, time);
    this.recordInfo(axis, value, time);
  }

  /**
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   * @param time {time}-目前訓練總計時
   */
  handleFirstPoint(axis: Axis, value: number, time: number) {
    this.waveRange[axis].peakTop = value;
    this.waveRange[axis].peakBottom = value;
    this.tempWave[axis].waveStartTime = time;
  }

  /**
   * 確認是否前面已有完整波形並更新現在波形紀錄
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   * @param time {time}-目前訓練總計時
   */
  recordInfo(axis: Axis, value: number, time: number) {
    const { waveTopTime, waveBottomTime, waveStartTime } = this.tempWave[axis];
    const currentPosition = this.waveRange[axis].getWavePosition(value);
    const crossCenter =
      currentPosition !== WavePosition.center && currentPosition !== this.prevPeakPosition[axis];
    const haveCompleteWave = waveStartTime && waveTopTime && waveBottomTime && crossCenter;
    if (haveCompleteWave) {
      this.handleCompleteWave(axis, time);
    } else {
      this.updateCurrentRecord(axis, value, time);
    }
  }

  /**
   * 確認是否前面已有完整波形並更新現在波形紀錄
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   * @param time {time}-目前訓練總計時
   */
  updateCurrentRecord(axis: Axis, value: number, time: number) {
    const { waveTopValue, waveBottomValue } = this.tempWave[axis];
    const currentPosition = this.waveRange[axis].getWavePosition(value);
    switch (currentPosition) {
      case WavePosition.top: {
        // 只紀錄該波形波峰最高值與時間
        if (!waveTopValue || value > waveTopValue) {
          this.tempWave[axis].waveTopValue = value;
          this.tempWave[axis].waveTopTime = time;
        }

        this.prevPeakPosition[axis] = currentPosition;
        break;
      }
      case WavePosition.bottom: {
        // 只紀錄該波形波谷最低值與時間
        if (!waveBottomValue || value < waveBottomValue) {
          this.tempWave[axis].waveBottomValue = value;
          this.tempWave[axis].waveBottomTime = time;
        }

        this.prevPeakPosition[axis] = currentPosition;
        break;
      }
      default:
        break;
    }
  }

  /**
   * 將前面的波形儲存以及開始紀錄下一段波形
   * @param axis {Axis}-軸線類別
   * @param time {time}-目前訓練總計時
   */
  handleCompleteWave(axis: Axis, time: number) {
    this.tempWave[axis].waveEndTime = time;
    if (this.checkWave(axis)) {
      this.updateWavePeak(axis);
      this.saveWave(axis);
    }

    this.tempWave[axis].init();
    this.tempWave[axis].waveStartTime = time; // 前個波形結束時間暫定為下個波形開始時間
  }

  /**
   * 確認波形是否過短或過小
   * @param axis {Axis}-軸線類別
   */
  checkWave(axis: Axis) {
    const { minAmplitude, minWaveTime, waveAmplitudeThreshold } = defaultOption;
    const { doubleAmplitude, waveTime } = this.tempWave[axis];
    const timeTooShort = waveTime < minWaveTime;
    const amplitudeTooSmall = doubleAmplitude < minAmplitude * waveAmplitudeThreshold;
    return !timeTooShort && !amplitudeTooSmall;
  }

  /**
   * 更新波峰波谷值
   * @param axis {Axis}-軸線類別
   */
  updateWavePeak(axis: Axis) {
    const { waveInfo } = this.tempWave[axis];
    const topValue = waveInfo.top.value;
    const bottomValue = waveInfo.bottom.value;
    this.checkOverPeak(axis, topValue);
    this.checkOverPeak(axis, bottomValue);
  }

  /**
   * 確認數值是否超出之前的波峰，超出則更新波峰數值
   * @param axis {Axis}-軸線類別
   * @param value {number}-g值
   */
  checkOverPeak(axis: Axis, value: number) {
    const { peakTop, peakBottom } = this.waveRange[axis];
    if (value > peakTop) this.waveRange[axis].peakTop = value;
    if (value < peakBottom) this.waveRange[axis].peakBottom = value;
  }

  /**
   * 將波形納入正式次數中
   * @param axis {Axis}-軸線類別
   */
  saveWave(axis: Axis) {
    const { waveInfo, doubleAmplitude } = this.tempWave[axis];
    this.allRecord[axis].push(waveInfo);
    this.handleRangeChange(axis, doubleAmplitude);
    this.resultCount = this.getCount();
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
    }

    this.traceBackWave(axis);
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
   * 以三軸中平均兩倍振幅範圍最大者且次數最多的軸判斷為主要參考次數
   */
  getCount() {
    const recordInfoX = this.getRecordInfo('x');
    const recordInfoY = this.getRecordInfo('y');
    const recordInfoZ = this.getRecordInfo('z');

    const sortResult = [recordInfoX, recordInfoY, recordInfoZ].sort((a, b) => {
      const avgAmplitudeA = a.avgAmplitude;
      const countA = a.count;
      const avgAmplitudeB = b.avgAmplitude;
      const countB = b.count;

      // 兩倍振幅範圍最大者由大到小排列
      if (avgAmplitudeB !== avgAmplitudeA) return avgAmplitudeB - avgAmplitudeA;

      // 若兩倍振幅範圍相同，則次數由多到少排列
      return countB - countA;
    });

    const reference = sortResult[0];
    const referenceCount = reference.count;

    if (referenceCount >= this.repsTarget) this.handleRecordFinish(); // 次數超過設定就停止紀錄
    return referenceCount;
  }

  /**
   * 取得指定軸的概要波形紀錄
   * @param axis {Axis}-軸線類別
   */
  getRecordInfo(axis: Axis) {
    let totalAmplitude = 0;
    let count = 0;
    this.allRecord[axis].forEach((_allRecord) => {
      const topValue = _allRecord.top.value;
      const bottomValue = _allRecord.bottom.value;
      totalAmplitude = totalAmplitude + (topValue - bottomValue);
      count++;
    });

    const avgAmplitude = totalAmplitude / (count || Infinity); // 避免分母為0而變成無限大
    return {
      axis: axis,
      avgAmplitude: avgAmplitude,
      count: count,
    };
  }

  /**
   * 停止紀錄並產生圖表
   */
  handleRecordFinish() {
    this.setFinished = true;
    this.createChart();
    this.createOriginChart();
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

    this.waveRange.x.init();
    this.waveRange.y.init();
    this.waveRange.z.init();

    this.samplingRecord = {
      x: [],
      y: [],
      z: [],
    };

    this.samplingOriginRecord = {
      x: [],
      y: [],
      z: [],
    };

    this.prevPeakPosition = {
      x: WavePosition.center,
      y: WavePosition.center,
      z: WavePosition.center,
    };

    this.resultCount = 0;

    this.prevPoint = {
      x: { value: null, time: 0 },
      y: { value: null, time: 0 },
      z: { value: null, time: 0 },
    };

    this.tempWave.x.init();
    this.tempWave.y.init();
    this.tempWave.z.init();
  }

  /**
   * 將紀錄物件轉為字串
   * @param axis {Axis}
   */
  stringify(axis: Axis) {
    return JSON.stringify(this.allRecord[axis]);
  }

  /**
   * 變更取樣率
   * @param e {ChangeEvent}
   */
  changeSamplingRate(e: any) {
    this.samplingRate = +e.target.value;
  }

  /**
   * 建立圖表
   */
  createChart() {
    setTimeout(() => {
      const { waveAmplitudeThreshold } = defaultOption;
      const xLowChartOption = new ChartOptions([
        {
          data: this.samplingRecord.x,
          showInLegend: false,
        },
      ]);

      const { effectAmplitude: xEffectAmplitude, waveCenter: xWaveCenter } = this.waveRange.x;
      const xThreshold = xEffectAmplitude * waveAmplitudeThreshold * 0.5;
      xLowChartOption['yAxis']['plotLines'] = [
        {
          color: 'green',
          width: 2,
          value: xWaveCenter + xThreshold,
        },
        {
          color: 'green',
          width: 2,
          value: xWaveCenter,
        },
        {
          color: 'green',
          width: 2,
          value: xWaveCenter - xThreshold,
        },
      ];

      const xAxisPlotLines: Array<{ color: string; width: 1; value: number }> = [];
      this.allRecord.x.forEach((_record) => {
        const { startTime, endTime } = _record;
        xAxisPlotLines.push({ color: 'pink', width: 1, value: startTime });
        xAxisPlotLines.push({ color: 'rgba(139, 247, 135, 1)', width: 1, value: endTime });
      });

      xLowChartOption['xAxis']['plotLines'] = xAxisPlotLines;
      const xLowChartElement = this.xChart.nativeElement;
      chart(xLowChartElement, xLowChartOption);

      const yLowChartOption = new ChartOptions([
        {
          data: this.samplingRecord.y,
          showInLegend: false,
        },
      ]);

      const { effectAmplitude: yEffectAmplitude, waveCenter: yWaveCenter } = this.waveRange.y;
      const yThreshold = yEffectAmplitude * waveAmplitudeThreshold * 0.5;
      yLowChartOption['yAxis']['plotLines'] = [
        {
          color: 'green',
          width: 2,
          value: yWaveCenter + yThreshold,
        },
        {
          color: 'green',
          width: 2,
          value: yWaveCenter,
        },
        {
          color: 'green',
          width: 2,
          value: yWaveCenter - yThreshold,
        },
      ];

      const yAxisPlotLines: Array<{ color: string; width: 1; value: number }> = [];
      this.allRecord.y.forEach((_record) => {
        const { startTime, endTime } = _record;
        yAxisPlotLines.push({ color: 'pink', width: 1, value: startTime });
        yAxisPlotLines.push({ color: 'rgba(139, 247, 135, 1)', width: 1, value: endTime });
      });

      yLowChartOption['xAxis']['plotLines'] = yAxisPlotLines;

      const yLowChartElement = this.yChart.nativeElement;
      chart(yLowChartElement, yLowChartOption);

      const zLowChartOption = new ChartOptions([
        {
          data: this.samplingRecord.z,
          showInLegend: false,
        },
      ]);

      const { effectAmplitude: zEffectAmplitude, waveCenter: zWaveCenter } = this.waveRange.z;
      const zThreshold = zEffectAmplitude * waveAmplitudeThreshold * 0.5;
      zLowChartOption['yAxis']['plotLines'] = [
        {
          color: 'green',
          width: 2,
          value: zWaveCenter + zThreshold,
        },
        {
          color: 'green',
          width: 2,
          value: zWaveCenter,
        },
        {
          color: 'green',
          width: 2,
          value: zWaveCenter - zThreshold,
        },
      ];

      const zAxisPlotLines: Array<{ color: string; width: 1; value: number }> = [];
      this.allRecord.z.forEach((_record) => {
        const { startTime, endTime } = _record;
        zAxisPlotLines.push({ color: 'pink', width: 1, value: startTime });
        zAxisPlotLines.push({ color: 'rgba(139, 247, 135, 1)', width: 1, value: endTime });
      });

      zLowChartOption['xAxis']['plotLines'] = zAxisPlotLines;

      const zLowChartElement = this.zChart.nativeElement;
      chart(zLowChartElement, zLowChartOption);
    }, 500);
  }

  createOriginChart() {
    setTimeout(() => {
      const { waveAmplitudeThreshold } = defaultOption;
      const xLowChartOption = new ChartOptions([
        {
          data: this.samplingOriginRecord.x,
          showInLegend: false,
        },
      ]);

      const { effectAmplitude: xEffectAmplitude, waveCenter: xWaveCenter } = this.waveRange.x;
      const xThreshold = xEffectAmplitude * waveAmplitudeThreshold * 0.5;
      xLowChartOption['yAxis']['plotLines'] = [
        {
          color: 'green',
          width: 2,
          value: xWaveCenter + xThreshold,
        },
        {
          color: 'green',
          width: 2,
          value: xWaveCenter,
        },
        {
          color: 'green',
          width: 2,
          value: xWaveCenter - xThreshold,
        },
      ];

      const xAxisPlotLines: Array<{ color: string; width: 1; value: number }> = [];
      this.allRecord.x.forEach((_record) => {
        const { startTime, endTime } = _record;
        xAxisPlotLines.push({ color: 'pink', width: 1, value: startTime });
        xAxisPlotLines.push({ color: 'rgba(139, 247, 135, 1)', width: 1, value: endTime });
      });

      xLowChartOption['xAxis']['plotLines'] = xAxisPlotLines;
      const xLowChartElement = this.xOChart.nativeElement;
      chart(xLowChartElement, xLowChartOption);

      const yLowChartOption = new ChartOptions([
        {
          data: this.samplingOriginRecord.y,
          showInLegend: false,
        },
      ]);

      const { effectAmplitude: yEffectAmplitude, waveCenter: yWaveCenter } = this.waveRange.y;
      const yThreshold = yEffectAmplitude * waveAmplitudeThreshold * 0.5;
      yLowChartOption['yAxis']['plotLines'] = [
        {
          color: 'green',
          width: 2,
          value: yWaveCenter + yThreshold,
        },
        {
          color: 'green',
          width: 2,
          value: yWaveCenter,
        },
        {
          color: 'green',
          width: 2,
          value: yWaveCenter - yThreshold,
        },
      ];

      const yAxisPlotLines: Array<{ color: string; width: 1; value: number }> = [];
      this.allRecord.y.forEach((_record) => {
        const { startTime, endTime } = _record;
        yAxisPlotLines.push({ color: 'pink', width: 1, value: startTime });
        yAxisPlotLines.push({ color: 'rgba(139, 247, 135, 1)', width: 1, value: endTime });
      });

      yLowChartOption['xAxis']['plotLines'] = yAxisPlotLines;

      const yLowChartElement = this.yOChart.nativeElement;
      chart(yLowChartElement, yLowChartOption);

      const zLowChartOption = new ChartOptions([
        {
          data: this.samplingOriginRecord.z,
          showInLegend: false,
        },
      ]);

      const { effectAmplitude: zEffectAmplitude, waveCenter: zWaveCenter } = this.waveRange.z;
      const zThreshold = zEffectAmplitude * waveAmplitudeThreshold * 0.5;
      zLowChartOption['yAxis']['plotLines'] = [
        {
          color: 'green',
          width: 2,
          value: zWaveCenter + zThreshold,
        },
        {
          color: 'green',
          width: 2,
          value: zWaveCenter,
        },
        {
          color: 'green',
          width: 2,
          value: zWaveCenter - zThreshold,
        },
      ];

      const zAxisPlotLines: Array<{ color: string; width: 1; value: number }> = [];
      this.allRecord.z.forEach((_record) => {
        const { startTime, endTime } = _record;
        zAxisPlotLines.push({ color: 'pink', width: 1, value: startTime });
        zAxisPlotLines.push({ color: 'rgba(139, 247, 135, 1)', width: 1, value: endTime });
      });

      zLowChartOption['xAxis']['plotLines'] = zAxisPlotLines;

      const zLowChartElement = this.zOChart.nativeElement;
      chart(zLowChartElement, zLowChartOption);
    }, 500);
  }

  /**
   * 解除訂閱晃動事件
   */
  unsubscribeDeviceMotionEvent() {
    if (this.deviceMotionSubscription) this.deviceMotionSubscription.unsubscribe();
  }

  /**
   * 解除訂閱rxjs與計時器
   */
  ngOnDestroy(): void {
    this.unsubscribeDeviceMotionEvent();
    if (this.timer) clearInterval(this.timer);
    if (this.wakeLock && this.wakeLock.release) this.wakeLock.release();
    if (this.wakeLock) this.wakeLock = null;
    this.ngUnsubscribe.next(null);
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
    const haveEffectAmplitude = _waveTopValue !== null && _waveBottomValue !== null;
    return haveEffectAmplitude ? _waveTopValue - _waveBottomValue : 0;
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
    const { maxAmplitude, minAmplitude } = defaultOption;
    if (accelerationValue > minAmplitude) {
      this._effectAmplitude = accelerationValue > maxAmplitude ? maxAmplitude : accelerationValue;
    }
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
    const countCenter = ((_peakTop || 0) + (_peakBottm || 0)) / 2;
    const absCountCenter = Math.abs(countCenter);
    const limitCenter = absCountCenter > 9.8 ? 9.8 : absCountCenter;
    return countCenter > 0 ? limitCenter : -limitCenter; // 中心點絕對值不超過g值
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

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor(dataset) {
    return {
      chart: {
        type: 'line',
        height: 150,
        backgroundColor: 'transparent',
        zoomType: 'x',
      },
      title: {
        text: '',
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        minPadding: 0.1,
        maxPadding: 0.03,
      },
      yAxis: {
        title: {
          text: '',
        },
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 10,
      },
      plotOptions: {
        series: {
          connectNulls: true,
        },
        spline: {
          pointPlacement: 'on',
        },
      },
      tooltip: {},
      series: dataset,
    };
  }
}

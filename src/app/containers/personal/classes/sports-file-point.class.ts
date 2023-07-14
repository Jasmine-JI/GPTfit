import {
  mathRounding,
  speedToPaceSecond,
  transformDistance,
  tempTransfer,
} from '../../../core/utils';
import { DataUnitType } from '../../../core/enums/common';
import { SportType } from '../../../core/enums/sports';

/**
 * 處理運動檔案點數據
 */
export class SportsFilePoint {
  /**
   * 是否含有效
   */
  private _hasEffectValue = false;

  /**
   * highchart格式數據
   */
  data: Array<any> = [];

  /**
   * 最佳值
   */
  best: number;

  /**
   * 累計值
   */
  total = 0;

  /**
   * 使用者使用公英制
   */
  unit = DataUnitType.metric;

  constructor(unit?: DataUnitType) {
    this.unit = unit as DataUnitType;
  }

  /**
   * 取得此圖表是否含有有效值
   */
  get hasEffectValue() {
    return this._hasEffectValue;
  }

  /**
   * 取得趨勢圖表內最大值
   */
  get bestValue() {
    return mathRounding(this.best ?? 0, 1);
  }

  /**
   * 取得趨勢圖表平均值
   */
  get avg() {
    const { data, total } = this;
    const length = data.length || Infinity; // 避免長度為零時，平均值會變無限大
    return mathRounding(total / length, 1);
  }

  /**
   * 處理圖表數據
   * @param second 該點計時秒
   * @param point 點數據
   */
  handleChartData(second: number, point: number | string | null, point2?: number | null) {
    const value = typeof point === 'string' ? +point : point;
    if (this.isEffect(value)) {
      this.setHasEffectValue();
      if ((value as number) > (this.best ?? 0)) this.best = value as number;

      this.total += value as number;
      this.data.push([second, value]);
    } else {
      this.data.push([second, 0]);
    }
  }

  /**
   * 該值是否有效
   */
  isEffect(point: number | null) {
    return Boolean(point);
  }

  /**
   * 圖表其中任一點為有效值，則此圖表即視為有效
   */
  setHasEffectValue() {
    this._hasEffectValue = true;
  }
}

/**
 * 處理gps路徑
 */
export class SportsFileGpsPoint extends SportsFilePoint {
  /**
   * 處理Gps路徑供地圖使用
   * @param second 該點計時秒
   * @param lat 緯度
   * @param lng 經度
   */
  handleChartData(second: number, lat: number | null, lng: number | null) {
    const [lastLat, lastLng] = this.data.at(-1) ?? [null, null];
    if (this.isEffect(lat) || this.isEffect(lng)) {
      this.setHasEffectValue();

      // 若路線開始時無有效點，則用現在的有效點填補
      if (!this.isEffect(lastLat) && !this.isEffect(lastLng))
        this.data = this.data.map(() => [+(lat as number), +(lng as number)]);

      this.data.push([+(lat as number), +(lng as number)]);
    } else {
      // 無效點使用前面有效點填補
      this.data.push([lastLat, lastLng]);
    }
  }

  /**
   * (0, 0)或(100, 100)目前定義無效點
   */
  isEffect(point: number | null) {
    const value = +(point ?? 0);
    return Boolean(value) && value !== 100;
  }
}

/**
 * 處理速度數據
 */
export class SportsFileSpeedPoint extends SportsFilePoint {
  /**
   * 根據公英制處理速度數據
   * @param second 該點計時秒
   * @param point 速度
   */
  handleChartData(second: number, point: number | null) {
    if (this.isEffect(point)) {
      this.setHasEffectValue();

      const speed = speedToPaceSecond(point as number, SportType.all, this.unit);
      if ((speed as number) > (this.best ?? 0)) this.best = speed as number;

      this.total += speed as number;
      this.data.push([second, speed]);
    } else {
      this.data.push([second, 0]);
    }
  }
}

/**
 * 處理跑步配速數據
 */
export class SportsFileRunPacePoint extends SportsFilePoint {
  /**
   * 根據公英制處理跑步配速數據
   * @param second 該點計時秒
   * @param point 速度
   */
  handleChartData(second: number, point: number | null) {
    if (this.isEffect(point)) {
      this.setHasEffectValue();

      const paceSecond = speedToPaceSecond(point as number, SportType.run, this.unit);
      // 速度越快配速越小
      if ((paceSecond as number) < (this.best ?? 3600)) this.best = paceSecond as number;

      this.total += paceSecond as number;
      this.data.push([second, paceSecond]);
    } else {
      this.data.push([second, 3600]);
    }
  }
}

/**
 * 處理游泳配速數據
 */
export class SportsFileSwimPacePoint extends SportsFilePoint {
  /**
   * 處理游泳配速數據
   * @param second 該點計時秒
   * @param point 速度
   */
  handleChartData(second: number, point: number | null) {
    if (this.isEffect(point)) {
      this.setHasEffectValue();

      const paceSecond = speedToPaceSecond(point as number, SportType.swim, this.unit);
      // 速度越快配速越小
      if ((paceSecond as number) < (this.best ?? 3600)) this.best = paceSecond as number;

      this.total += paceSecond as number;
      this.data.push([second, paceSecond]);
    } else {
      this.data.push([second, 3600]);
    }
  }
}

/**
 * 處理划船配速數據
 */
export class SportsFileRowPacePoint extends SportsFilePoint {
  /**
   * 處理划船配速數據
   * @param second 該點計時秒
   * @param point 速度
   */
  handleChartData(second: number, point: number | null) {
    if (this.isEffect(point)) {
      this.setHasEffectValue();

      const paceSecond = speedToPaceSecond(point as number, SportType.row, this.unit);
      // 速度越快配速越小
      if ((paceSecond as number) < (this.best ?? 3600)) this.best = paceSecond as number;

      this.total += paceSecond as number;
      this.data.push([second, paceSecond]);
    } else {
      this.data.push([second, 3600]);
    }
  }
}

/**
 * 處理海拔數據
 */
export class SportsFileAltitudePoint extends SportsFilePoint {
  /**
   * 根據公英制處理海拔數據
   * @param second 該點計時秒
   * @param point 海拔數據
   */
  handleChartData(second: number, point: string | number | null): void {
    const [, currentLast] = this.data.at(-1) ?? [null, null];
    const value = +(point ?? 0);
    if (this.isEffect(value)) {
      this.setHasEffectValue();

      const { value: altitude } = transformDistance(value, this.unit, false);
      // 若數據開始時無有效值，則用現在的有效值填補
      if (!this.isEffect(currentLast)) this.data = this.data.map(() => altitude);
      if (altitude > (this.best ?? 0)) this.best = altitude;

      this.total += altitude;
      this.data.push([second, altitude]);
    } else {
      this.data.push([second, currentLast]);
    }
  }
}

/**
 * 處理溫度數據
 */
export class SportsFileTempPoint extends SportsFilePoint {
  /**
   * 根據公英制處理溫度數據
   * @param second 該點計時秒
   * @param point 海拔數據
   */
  handleChartData(second: number, point: number | null): void {
    const [, currentLast] = this.data.at(-1) ?? [null, null];
    if (this.isEffect(point)) {
      this.setHasEffectValue();
      const temp = tempTransfer(point as number, {
        unitType: this.unit,
        showUnit: false,
      }) as number;
      // 若數據開始時無有效值，則用現在的有效值填補
      if (!this.isEffect(currentLast)) this.data = this.data.map(() => temp);
      if (temp > (this.best ?? 0)) this.best = temp;

      this.total += temp;
      this.data.push([second, temp]);
    } else {
      this.data.push([second, currentLast]);
    }
  }
}

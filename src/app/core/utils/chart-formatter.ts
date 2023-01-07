import dayjs from 'dayjs';
import { DataUnitType } from '../enums/common';
import { mi, ft } from '../../shared/models/bs-constant';
import { mathRounding } from './index';
import { getPaceUnit, paceSecondTimeFormat } from './sports';
import { SportType } from '../../shared/enum/sports';

/**
 * 預設x軸日期顯示格式(highchart用)
 */
export function getDateTimeLabelFormats() {
  return {
    millisecond: '%m/%d',
    second: '%m/%d',
    minute: '%m/%d',
    hour: '%m/%d',
    day: '%m/%d',
    week: '%m/%d',
    month: '%Y/%m',
    year: '%Y',
  };
}

/**
 * 將時間轉為所需格式(HH:mm:ss)(highchart用)
 */
export function timeFormatter(value: number | undefined = undefined) {
  const yVal = value !== undefined ? value : this.y;
  if (yVal === 0) return 0;

  const costhr = Math.floor(yVal / 3600);
  const costmin = Math.floor((yVal - costhr * 60 * 60) / 60);
  const costsecond = Math.round(yVal - costmin * 60);
  const timeMin = ('0' + costmin).slice(-2);
  const timeSecond = ('0' + costsecond).slice(-2);
  let time = '';

  if (costhr === 0 && timeMin === '00') {
    time = `0:${timeSecond}`;
  } else if (costhr === 0) {
    time = `${timeMin}:${timeSecond}`;
  } else {
    time = `${costhr}:${timeMin}:${timeSecond}`;
  }

  return time;
}

/**
 * 用於圖表y軸時間轉換成指定格式(HH:mm:ss)
 */
export function yAxisTimeFormat() {
  return timeFormatter.bind(this)(this.value);
}

/**
 * 用於圖表y軸時間轉換成指定格式(HH:mm:ss)
 */
export function yAxisPercentageFormat() {
  return `${this.value}%`;
}

/**
 * 用於非心率區間相關圖表浮動框時間轉換成指定格式
 */
export function tooltipFormat() {
  const dateRangeIndex = this.point.index;
  const [startTime, endTime] = this.series.options.custom.dateRange[dateRangeIndex];
  return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}
    <br/>${this.series.name}: ${this.y}`;
}

/**
 * 用於非心率區間相關圖表浮動框時間轉換成指定格式
 */
export function tooltipTimeFormat() {
  const zoneTime = timeFormatter.bind(this);
  const dateRangeIndex = this.point.index;
  const [startTime, endTime] = this.series.options.custom.dateRange[dateRangeIndex];
  return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}
    <br/>${this.series.name}: ${zoneTime()}`;
}

/**
 * 用於心率區間相關圖表浮動框時間轉換成指定格式
 */
export function tooltipHrZoneFormat() {
  const zoneTime = timeFormatter.bind(this);
  const yTotal = this.total;
  const totalHr = Math.floor(yTotal / 3600);
  const totalmin = Math.floor(Math.round(yTotal - totalHr * 60 * 60) / 60);
  const totalsecond = Math.round(yTotal - totalmin * 60);
  const timeTotalMin = ('0' + totalmin).slice(-2);
  const timeTotalSecond = ('0' + totalsecond).slice(-2);
  let totalZoneTime = '';

  if (totalHr === 0 && timeTotalMin === '00') {
    totalZoneTime = `0:${timeTotalSecond}`;
  } else if (totalHr === 0) {
    totalZoneTime = `${timeTotalMin}:${timeTotalSecond}`;
  } else {
    totalZoneTime = `${totalHr}:${timeTotalMin}:${timeTotalSecond}`;
  }

  const dateRangeIndex = this.point.index;
  const [startTime, endTime] = this.series.options.custom.dateRange[dateRangeIndex];
  return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}
    <br/>${this.series.name}: ${zoneTime()}
    <br/>Total: ${totalZoneTime}`;
}

/**
 * 用於百分比相關圖表浮動框顯示
 */
export function tooltipPercentageFormat() {
  const dateRangeIndex = this.point.index;
  const [startTime, endTime] = this.series.options.custom.dateRange[dateRangeIndex];
  return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}
    <br/>${this.series.name}: ${this.y}%`;
}

/**
 * 依使用者單位取得距離相關圖表軸線格式
 * @param unit {DataUnitType}-使用者使用單位
 */
export function distanceAxisFormat(unit: DataUnitType) {
  const isMetric = unit === DataUnitType.metric;
  let formatter: () => string;
  if (isMetric) {
    formatter = function () {
      const [yVal, userUnit] = this.value >= 1000 ? [this.value / 1000, 'km'] : [this.value, 'm'];
      return `${mathRounding(yVal, 1)} ${userUnit}`;
    };
  } else {
    formatter = function () {
      // 大於1英哩才顯示英哩，否則以呎表示
      const miValue = this.value / mi;
      const [yVal, userUnit] = miValue >= 1000 ? [miValue, 'mi'] : [this.value / ft, 'ft'];
      return `${mathRounding(yVal, 1)} ${userUnit}`;
    };
  }

  return formatter;
}

/**
 * 依使用者單位與數值大小，距離相關圖表提示框格式
 * @param unit {DataUnitType}-使用者使用單位
 */
export function distanceTooltipFormat(unit: DataUnitType) {
  const isMetric = unit === DataUnitType.metric;
  let formatter: () => string;
  if (isMetric) {
    formatter = function () {
      const dateRangeIndex = this.point.index;
      const [startTime, endTime] = this.series.options.custom.dateRange[dateRangeIndex];
      const [value, suffix] = this.y >= 1000 ? [this.y / 1000, 'km'] : [this.y, 'm'];
      return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}
        <br/>${this.series.name}: ${mathRounding(value, 1)} ${suffix}
      `;
    };
  } else {
    formatter = function () {
      const dateRangeIndex = this.point.index;
      const [startTime, endTime] = this.series.options.custom.dateRange[dateRangeIndex];
      const miValue = this.y / mi;
      const [value, suffix] = miValue >= 1000 ? [miValue, 'mi'] : [this.y / ft, 'ft'];
      return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}
        <br/>${this.series.name}: ${mathRounding(value, 1)} ${suffix}
      `;
    };
  }

  return formatter;
}

/**
 * 用於個人目標達成率圖表浮動框時間轉換成指定格式
 */
export function targetAchieveTooltip() {
  const { baseDateRange, compareDateRange } = this.series.options.custom;
  const { index } = this.point;
  const dateRangeIndex = compareDateRange ? Math.floor(index / 2) : index;
  const [startTime, endTime] =
    this.y === 1 ? compareDateRange[dateRangeIndex] : baseDateRange[dateRangeIndex];
  return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}`;
}

/**
 * 用於個人最大與平均圖表浮動框轉換成指定格式
 * @param unit {string}-圖表數據單位
 */
export function complexTrendTooltip(unit: string) {
  const formatter = function () {
    const [baseMaxHrInfo, baseAvgHrInfo, compareMaxHrInfo, compareAvgHrInfo] = this.points;
    const getText = (maxInfo: any, avgInfo: any) => {
      const [startDate, endDate] = avgInfo.point.additionalInfo;
      return `${dayjs(startDate).format('YYYY-MM-DD')}~${dayjs(endDate).format('YYYY-MM-DD')}
        <br/>${maxInfo.series.name}: ${mathRounding(maxInfo.y, 1)} ${unit}
        <br/>${avgInfo.series.name}: ${mathRounding(avgInfo.y, 1)} ${unit}
      `;
    };

    let result = getText(baseMaxHrInfo, baseAvgHrInfo);
    if (compareAvgHrInfo) result += `<br/><br/>${getText(compareMaxHrInfo, compareAvgHrInfo)}`;

    return result;
  };

  return formatter;
}

/**
 * 用於個人最大與平均心率圖表浮動框轉換成指定格式
 * @param isMetric {boolean}-是否為公制單位
 */
export function bodyWeightTooltip(isMetric = true) {
  const unit = isMetric ? 'kg' : 'lb';
  const formatter = function () {
    const [baseFatRateInfo, baseWeightInfo, compareFatRateInfo, compareWeightInfo] = this.points;
    const getText = (fatRateInfo: any, weightInfo: any) => {
      const [startDate, endDate] = weightInfo.point.additionalInfo;
      return `${dayjs(startDate).format('YYYY-MM-DD')}~${dayjs(endDate).format('YYYY-MM-DD')}
        <br/>${fatRateInfo.series.name}: ${mathRounding(fatRateInfo.y, 1)} %
        <br/>${weightInfo.series.name}: ${mathRounding(weightInfo.y, 1)} ${unit}
      `;
    };

    let result = getText(baseFatRateInfo, baseWeightInfo);
    if (compareWeightInfo) result += `<br/><br/>${getText(compareFatRateInfo, compareWeightInfo)}`;

    return result;
  };

  return formatter;
}

/**
 * 用於個人配速圖表浮動框轉換成指定格式
 */
export function paceTooltipFormatter(sportType: SportType, userUnit: DataUnitType) {
  const unit = getPaceUnit(sportType, userUnit);
  const formatter = function () {
    const [baseMaxPaceInfo, baseAvgPaceInfo, compareMaxPaceInfo, compareAvgPaceInfo] = this.points;
    const getText = (maxPaceInfo: any, avgPaceInfo: any) => {
      const [startDate, endDate] = avgPaceInfo.point.additionalInfo;
      return `${dayjs(startDate).format('YYYY-MM-DD')}~${dayjs(endDate).format('YYYY-MM-DD')}
        <br/>${maxPaceInfo.series.name}: ${paceSecondTimeFormat(maxPaceInfo.y)} ${unit}
        <br/>${avgPaceInfo.series.name}: ${paceSecondTimeFormat(avgPaceInfo.y)} ${unit}
      `;
    };

    let result = getText(baseMaxPaceInfo, baseAvgPaceInfo);
    if (compareAvgPaceInfo)
      result += `<br/><br/>${getText(compareMaxPaceInfo, compareAvgPaceInfo)}`;

    return result;
  };

  return formatter;
}

/**
 * 用於個人配速圖表y軸轉換成指定格式
 */
export function paceYAxisFormatter() {
  if (this.value === 0) return `00'00"`;
  return paceSecondTimeFormat(this.value);
}

/**
 * 圖表每一點（柱）標註轉換為指定格式
 */
export function dataLabelsFormatter() {
  return mathRounding(this.point.y, 1);
}

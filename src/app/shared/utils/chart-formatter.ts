import dayjs from 'dayjs';

/**
 * 預設x軸日期顯示格式(highchart用)
 * @author kidin=1110418
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
    year: '%Y'
  };

}

/**
 * 將時間轉為所需格式(HH:mm:ss)(highchart用)
 * @author kidin=1110418
 */
 export function timeFormatter(value: number = undefined) {
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
 * @author kidin-1110418
 */
 export function yAxisTimeFormat() {
  return timeFormatter.bind(this)(this.value);
}

/**
 * 用於圖表y軸時間轉換成指定格式(HH:mm:ss)
 * @author kidin-1110418
 */
 export function yAxisPercentageFormat() {
  return `${this.value}%`;
}

/**
 * 用於非心率區間相關圖表浮動框時間轉換成指定格式
 * @author kidin-1110418
 */
 export function tooltipFormat() {
  const dateRangeIndex = this.point.index;
  const [startTime, endTime] = this.series.options.custom.dateRange[dateRangeIndex];
  return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}
    <br/>${this.series.name}: ${this.y}`;
}

/**
 * 用於非心率區間相關圖表浮動框時間轉換成指定格式
 * @author kidin-1110418
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
 * @author kidin-1110418
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
 * @author kidin-1110418
 */
export function tooltipPercentageFormat() {
  const dateRangeIndex = this.point.index;
  const [startTime, endTime] = this.series.options.custom.dateRange[dateRangeIndex];
  return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}
    <br/>${this.series.name}: ${this.y}%`;
}
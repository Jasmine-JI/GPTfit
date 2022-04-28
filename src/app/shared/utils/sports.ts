import { SportType } from '../enum/sports';
import { Unit, mi } from '../models/bs-constant';

/**
 * 根據運動類型將速度轉成配速(若為bs英制則公里配速轉英哩配速)
 * @param data {number | string}-速度
 * @param sportType {SportType}-運動類別
 * @param unit {Unit}-使用者所使用的單位
 */
export function speedToPace(data: number | string, sportType: SportType, unit: Unit) {
  const value = +data;
  const converseType = [SportType.run, SportType.swim, SportType.row];
  const isMetric = unit === Unit.metric;
  let result = { value: <number | string> value, unit: '' };

  // 其他運動類別則直接返回速度值
  if (!converseType.includes(sportType)) return result;

  result = { value: `60'00"`, unit: getPaceUnit(sportType, unit) };

  // 速度為0則配速一律顯示60'00"
  if (value === 0) return result;

  let yVal: number;
  switch (sportType) {
    case SportType.run:  // 跑步配速
      const valueConversion = isMetric ? value : value / mi;
      yVal = (60 / valueConversion) * 60;
      break;
    case SportType.swim:  // 游泳配速
      yVal = (60 / value) * 60 / 10;
      break;
    case SportType.row:  // 划船配速
      yVal = (60 / value) * 60 / 2;
      break;
  }

  const costminperkm = Math.floor(yVal / 60);
  const costsecondperkm = Math.round(yVal - costminperkm * 60);

  // 配速超過60一律以60計。
  if (costminperkm > 60) return result;

  let timeMin = ('0' + costminperkm).slice(-2);
  let timeSecond = ('0' + costsecondperkm).slice(-2);
  // 因應四捨五入
  if (timeSecond === '60') {
    timeSecond = '00';
    timeMin = +timeMin === 60 ? '60' : `${+timeMin + 1}`
  }

  result.value = `${timeMin}'${timeSecond}"`;
  return result;
}

/**
 * 根據運動類別與使用者使用單位取得配速單位
 * @param sportType {SportType}-運動類別
 * @param unit {Unit}-使用者所使用的單位
 */
export function getPaceUnit(sportType: SportType, unit: Unit) {

  switch (sportType) {
    case SportType.run:
      return unit === Unit.metric ? 'min/km' : 'min/mi';
    case SportType.swim:
      return 'min/100m';
    case SportType.row:
      return 'min/500m';
  }

}
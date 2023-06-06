import { ft, inch } from '../models/const/bs-constant.model';

/**
 * 四捨五入至小數點特定位數
 * @param decimal {number}-四捨五入位數
 * @param digit {number}-位數
 * @author kidin-1110318
 */
export function mathRounding(decimal: number, digit: number) {
  if (decimal === 0) return 0;
  return parseFloat(decimal.toFixed(digit));
}

/**
 * 計算百分比數據
 * @param numerator {number}-分子
 * @param denominator {number}-分母
 * @param decimal {number}-四捨五入位數
 */
export function countPercentage(numerator: number, denominator: number, decimal = 0) {
  return mathRounding(((numerator ?? 0) / (denominator || Infinity)) * 100, decimal);
}

/**
 * 將數值依係數轉換為另一值
 * @param value {number}-待轉換的值
 * @param convert {boolean}-是否轉換
 * @param forward {boolean}-是否為公制轉英制
 * @param coefficient {number}-轉換係數
 * @param digit {number}-四捨五入的位數
 */
export function valueConvert(
  value: number,
  convert: boolean,
  forward: boolean,
  coefficient: number,
  digit: number | null = null
) {
  if (convert) value = forward ? value / coefficient : value * coefficient;
  if (convert && forward) digit = 0; // 設定英制不含小數點
  return digit !== null ? mathRounding(value, digit) : value;
}

/**
 * 畢氏定理
 * @param valueArr {Array<number>}
 */
export function pythagorean(valueArr: Array<number>) {
  const countPowTotal = (preVal: number, currentVal: number) => {
    return preVal + Math.abs(currentVal) ** 2;
  };

  return parseFloat(Math.sqrt(valueArr.reduce(countPowTotal, 0)).toFixed(1));
}

/**
 * 計算兩點gpx之間的距離（大圓距離）
 * @param gpxA {Array<number>}
 * @param gpxB {Array<number>}
 */
export function countDistance(gpxA: Array<number>, gpxB: Array<number>) {
  const earthR = 6371; // km
  const radConst = Math.PI / 180;
  const [φA, λA] = [...gpxA];
  const [φB, λB] = [...gpxB];
  if (φA !== φB || λA !== λB) {
    const [φRA, λRA] = [...[φA * radConst, λA * radConst]];
    const [φRB, λRB] = [...[φB * radConst, λB * radConst]];
    const sigma = Math.acos(
      Math.sin(φRA) * Math.sin(φRB) + Math.cos(φRA) * Math.cos(φRB) * Math.cos(Math.abs(λRB - λRA))
    );
    return +(earthR * sigma * 1000).toFixed(0);
  } else {
    return 0;
  }
}

/**
 * 身高公英制轉換 公分<->吋
 * @param height {number | string}-身高（轉換前）
 * @param convert {boolean}-是否轉換
 * @param forward {boolean}-是否為公制轉英制
 */
export function bodyHeightTransfer(
  height: number | string,
  convert: boolean,
  forward: boolean
): number | string {
  if (convert) {
    if (forward) {
      // 公分轉吋
      height = height as number;
      const feet = Math.floor(height / 100 / ft);
      const mantissa = parseFloat(((height - feet * 0.3 * 100) / inch).toFixed(0));
      return `${feet}"${mantissa}`;
    } else {
      // 吋轉公分
      const [feet, mantissa] = (height as string).split('"');
      return parseFloat((+feet * 0.3 * 100 + +mantissa * inch).toFixed(1));
    }
  } else {
    return forward ? height : `${height}`;
  }
}

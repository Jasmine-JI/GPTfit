import dayjs from 'dayjs';

/**
 * 計算BMI
 * @param height {number}-身高(cm)
 * @param weight {number}-體重(kg)
 * @return {number}-BMI
 */
export function countBMI(height: number, weight: number): number {
  const bmi = weight / (height / 100) ** 2;
  return parseFloat(bmi.toFixed(1));
}

/**
 * 計算年齡
 * @param birthday {string}-生日
 */
export function countAge(birthday: string) {
  const todayMoment = dayjs();
  const birthMoment = dayjs(birthday, 'YYYYMMDD');
  return todayMoment.diff(birthMoment, 'year');
}

/**
 * 計算FFMI
 * @param height {number}-身高
 * @param weight {number}-體重
 * @param fatRate {number}-脂肪率
 */
export function countFFMI(height: number, weight: number, fatRate: number) {
  // 體脂率為0亦當作null
  if (fatRate) {
    const FFMI = (weight * (1 - fatRate / 100)) / (height / 100) ** 2;
    if (height > 180) {
      return parseFloat((FFMI + (6 * (height - 180)) / 100).toFixed(1));
    } else {
      return parseFloat(FFMI.toFixed(1));
    }
  } else {
    return null;
  }
}

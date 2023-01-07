/**
 * 數據整合類別
 */
export enum IntegrationType {
  totalData = 1, // 加總的數據類型
  avgData, // 平均的數據類型
  effectAvgData, // 有效平均的數據類型，數值為0或null等無效值不計入分子與分母計算
  noRepeatTotalData, // 不重複的加總數據類型
  noRepeatAvgData, // 不重複的平均數據類型
  noRepeatEffectAvgData, // 不重複的有效平均數據類型
}

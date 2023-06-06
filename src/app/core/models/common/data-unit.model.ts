import { DataUnitType } from '../../enums/common';
import { SportType } from '../../enums/sports';

/**
 * 數據進行公英制轉換所需的設定參數
 */
export interface DataUnitOption {
  unitType?: DataUnitType; // 公英制
  showUnit?: boolean; // 顯示單位與否
  sportsType?: SportType; // 運動類別
  convertKiloAlways?: boolean; // 是否皆轉為千單位，ex m => kmㄋ
}

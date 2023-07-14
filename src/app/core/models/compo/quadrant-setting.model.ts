import { MinMaxHandler } from '../../classes';

/**
 * 象限圖可設定的數據類別
 */
export type QuadrantDataOpt = 'hr' | 'speed' | 'cadence' | 'power';

/**
 * 運動檔案象限圖設定
 */
export interface QuadrantSetting {
  xAxis: {
    type: QuadrantDataOpt;
    origin: number;
  };
  yAxis: {
    type: QuadrantDataOpt;
    origin: number;
  };
  meaning: {
    quadrantI: string; // 第一象限定義
    quadrantII: string; // 第二象限定義
    quadrantIII: string; // 第三象限定義
    quadrantIV: string; // 第四象限定義
  };
  customMeaning: boolean; // 是否已自行修改象限定義
}

/**
 * 象限圖相關數據
 */
export interface QuadrantData {
  chartData: Array<QuadrantPoint>;
  boundary: {
    x: MinMaxHandler;
    y: MinMaxHandler;
  };
  quadrantPointNum: QuadrantNum;
}

/**
 * 象限圖單點資訊
 */
export interface QuadrantPoint {
  x: number;
  y: number;
  color: string;
}

/**
 * 各象限數據數量
 */
export interface QuadrantNum {
  i: number;
  ii: number;
  iii: number;
  iv: number;
}

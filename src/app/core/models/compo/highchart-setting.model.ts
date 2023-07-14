/**
 * @reference https://api.highcharts.com/highcharts/
 * 需注意有些設定之間會衝突，詳見 Highchart API 文件
 */
export interface HighchartSetting {
  chart: HighchartSettingChart;
  credits: {
    enabled: boolean; // 是否在圖表顯示'Highchart'字樣
  };
  legend?: HighchartSettingLegend; // 數據類別對應說明
  plotOptions?: HighchartPlotOptions;
  series: Array<SeriesOption>;
  title: HighchartSettingTitle;
  tooltip: HighchartSettingTooltip;
  xAxis: HighchartSettingAxis | Array<HighchartSettingAxis>;
  yAxis: HighchartSettingAxis | Array<HighchartSettingAxis>;
}

export interface HighchartSettingChart {
  height?: number;
  width?: number;
  backgroundColor?: string;
  margin?: number | Array<number>; // 圖表（不含 title、legend）與邊界的距離
  spacing?: number | Array<number>; // 圖表（含 title、legend）與邊界的距離，預設[10, 10, 15, 10]（[上, 右, 下, 左]）
  type?: ChartType;
  zoomType?: 'x' | 'y' | 'xy'; // undefined 為不啟用
  marginLeft?: number; // 圖表左側留白距離（不含y axis）
  marginRight?: number; // 圖表右側留白距離（不含y axis）
}

export interface HighchartSettingLegend {
  verticalAlign?: VerticalPosition;
  align?: HorizonPosition;
  enabled?: boolean; // 是否顯示針對不同類別數據的圖例
  valueDecimals?: number; // 數據四捨五入位數
}

export interface HighchartSettingTitle {
  text: string;
  align?: HorizonPosition;
  margin?: number;
  x?: number;
  y?: number;
}

export interface HighchartPlotOptions {
  line?: {
    pointPlacement?: PointPlacement;
  };
  column?: {
    pointPlacement?: PointPlacement;
    stacking?: 'normal'; // 圖表是否堆疊，normal為開啟，undefined為關閉。
  };
  spline?: {
    pointPlacement?: PointPlacement;
  };
  pie?: {
    innerSize?: number; // 內環直徑，無值為圓餅圖，有值為圓環圖
    borderWidth?: number; // 圓餅圖，區塊間邊界寬度
    center?: [string | number, string | number]; // 圖表中心點距離圖表原點的設定，可用數字或%進行設定，['50%', '50%']為置中
    startAngle?: number; // 0為上方，順時鐘計算角度
    endAngle?: number; // 0為上方，順時鐘計算角度
    size?: string | number; // 圖表尺寸，可用數字或%進行設定。
    dataLabels?: {
      enabled?: boolean;
      distance?: string | number; // 標註與圖表本體的距離
      color?: string;
      formatter?: CallBackFormatter;
      style?: {
        fontWeight?: string;
        fontSize?: string;
        color?: string;
      };
    };
  };
  scatter?: {
    marker: {
      radius: 2;
    };
  };
  area?: {
    zones?: Array<AreaZoneColor>;
    opacity?: number; // 整體透明度 0～1
    fillOpacity?: number; // 填充顏色透明度 0～1
    marker?: {
      enabled: boolean; // 是否顯示標註記號
    };
    lineWidth?: number; // 線條寬度
    fillColor?: LinearGradient; // 填充顏色
    color?: string; // 整體顏色
    threshold?: number; // 門檻值
  };
  series?: {
    animation?: boolean; // 是否使用動畫，預設為true，此參數可帶物件去設定動畫，但目前暫無需求
    borderRadius?: number; // 柱子圓角(無法設定單一角為圓角)
    borderColor?: string; // 邊界顏色
    pointPadding?: number; // 兩個數據間的間距
    groupPadding?: number; // 兩組數據間的間距
    pointWidth?: number; // 可視為直條或橫條圖的柱子寬度
    maxPointWidth?: number; // 可視為直條或橫條圖的柱子最大寬度
    connectNulls?: boolean; // 折線圖遇到 null 數據，是否將前後相連（flase為中斷）
    fillOpacity?: number; // 填充顏色的透明度，僅適用於區域圖(chart.type: 'area')
    dataLabels?: {
      enabled: boolean; // 於圖表上顯示數據標註與否
      formatter?: CallBackFormatter;
    };
    showInLegend?: boolean; // 同 legend.enabled
    marker?: {
      enabled: boolean; // 是否顯示標記圖形
    };
  };
}

/**
 * Highchart 軸線相關設定
 */
export interface HighchartSettingAxis {
  categories?: Array<string>; // 手動處理的數據分類
  crosshair?: boolean; // 是否啟用追蹤線
  dateTimeLabelFormats?: DateTimeLabelFormats;
  floor?: number; // 圖表可顯示的最小值
  ceiling?: number; // 圖表可顯示的最大值
  gridLineColor?: string; // 格線顏色
  labels?: {
    title?: {
      text?: string;
      labels?: {
        align?: HorizonPosition;
      };
    };
    style?: {
      color?: string;
      fontSize?: string;
    };
    align?: HorizonPosition;
    format?: string;
    formatter?: CallBackFormatter;
  };
  min?: number;
  max?: number;
  minPadding?: number; // 數據最小值距離軸線的距離，適用數據最小值距離軸線很遠的狀況
  maxPadding?: number; // 數據最大值距離頂部的距離，適用數據最大值距離軸線很遠的狀況
  offset?: number; // 位置偏移
  startOnTick?: boolean; // 軸線開始位置是否列為一結點
  endOnTick?: boolean; // 軸線結束位置是否列為一結點
  type?: 'linear' | 'datetime' | 'category' | 'logarithmic' | 'scatter';
  title?: {
    align?: VerticalPosition;
    text?: string;
    offset?: number;
    x?: number;
    y?: number;
  } | null;
  tickAmount?: number; // 軸線標示數目，僅適用於 type: linear。
  tickInterval?: number; // 軸線標示的數據間距，僅適用於 type: 'linear' | 'datetime'。
  tickPixelInterval?: number; // 根據設定的pixel值自動設定軸線標示的數據間距。
  tickPositions?: Array<number>; // 手動設定軸線上標示的數據。
  opposite?: boolean; // 軸線是否放置於另一邊
  pointPlacement?: PointPlacement;
  reversed?: boolean; // 是否反轉軸線
}

/**
 * @reference https://api.highcharts.com/class-reference/Highcharts.Time#dateFormat
 */
export interface DateTimeLabelFormats {
  millisecond: string;
  second: string;
  minute: string;
  hour: string;
  day: string;
  week: string;
  month: string;
  year: string;
}

/**
 * 圖表類別
 */
export type ChartType = 'line' | 'column' | 'spline' | 'area' | 'treemap' | 'pie';

/**
 * 數據位置跟軸線的相對位置設定
 */
export type PointPlacement = number | 'on' | 'between';

/**
 * highchart用來處理水平位置的快速設定
 */
export type HorizonPosition = 'left' | 'center' | 'right';

/**
 * highchart用來處理垂直位置的快速設定
 */
export type VerticalPosition = 'top' | 'middle' | 'bottom';

/**
 * 提示框設定參數
 */
export interface HighchartSettingTooltip {
  animation?: boolean; // 是否使用動畫
  dateTimeLabelFormats?: DateTimeLabelFormats;
  enabled?: boolean;
  formatter?: CallBackFormatter;
  pointFormat?: string; // 提示框處理y軸數據的格式
  pointFormatter?: CallBackFormatter;
  xDateFormat?: string; // 提示框針對type: 'datetime'的x軸數據的格式
  shadow?: boolean; // 是否啟用提示框陰影
  style?: {
    fontSize: string;
  };
  valueDecimals?: number; // 顯示小數點後n位
  valuePrefix?: string; // 前綴
  valueSuffix?: string; // 後綴
  split?: boolean; // 同時顯示所有 group 的 tooltip
  shared?: boolean; // 不同 group 圖表是否共用 tooltip
  hideDelay?: number; // 隱藏tooltip的延遲秒數
  outside?: boolean; // 提示框是否可以超出圖表
}

/**
 * 各數據個別設定內容
 */
export interface SeriesOption {
  type?: ChartType;
  yAxis?: number; // y軸對應編號，用於多個y軸顯示的圖表
  data: Array<number | Array<number> | DataSetting>;
  name?: string;
  color?: string | LinearGradient;
  marker?: {
    // 可用'url(imagePath)'自定義marker圖形
    symbol?: 'circle' | 'square' | 'diamond' | 'triangle' | 'triangle-down' | string;
    fillColor?: string;
    enabled?: boolean;
    height?: number;
    width?: number;
  };
  tooltip?: HighchartSettingTooltip;
  custom?: {
    // 提供開發者額外儲存其他資訊的參數
    dateRange?: Array<[number, number]>; // 時間範圍（開始與結束時間）
    [propName: string]: any;
  };
}

/**
 * 用來處理數據或軸線標註格式的函式
 */
export type CallBackFormatter = () => string;

/**
 * 漸變色設定
 * @reference https://www.highcharts.com/docs/chart-design-and-style/colors
 */
export interface LinearGradient {
  linearGradient: {
    x1: number; // 0對應左邊，1對應右邊
    x2: number; // 0對應左邊，1對應右邊
    y1: number; // 0對應上邊，1對應下邊
    y2: number; // 0對應上邊，1對應下邊
  };
  stops: Array<[number, string]>; // Array<[相對位置（百分比概念，1為100％）, 顏色]>, ex: [[0, 'green'], [1, 'red']]
}

/**
 * 個別數據可設定項目
 */
export interface DataSetting {
  id?: string;
  name?: string;
  value?: number;
  parent?: string; // 用於tree map分類
  x?: number;
  y?: number;
  z?: number | string; // 二維圖表中此參數也可用來儲存其他數據
  translate?: string; // 自定義的參數，用來處理多國語系
  color?: string;
  sliced?: boolean; // 圓餅圖中是否將此區塊與其他區塊進行分隔
  borderColor?: string;
  borderWidth?: number;
}

/**
 * 區域圖y軸各區間顏色設定
 */
export interface AreaZoneColor {
  value?: number;
  color: string;
}

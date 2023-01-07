/**
 * 群組課程分析日曆類型
 */
export type CalenderType = 'single' | 'range';

/**
 * 群組課程分析日曆單一天資訊
 */
export interface OneCalenderDay {
  day: number;
  startTimestamp: number;
  endTimestamp: number;
  haveClass: boolean;
}

/**
 * 日期類別為開始或結束
 */
export type DayType = 'start' | 'end';

/**
 * 用於月曆選擇器之可開放選擇的星期
 */
export type WeekDayLock = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];

/**
 * 用於月曆選擇器之該日期資訊
 */
export interface CalenderDayInfo {
  year: string;
  month: string;
  day: string;
  timestamp: number;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
}

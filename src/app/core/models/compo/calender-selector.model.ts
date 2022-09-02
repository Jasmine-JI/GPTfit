export type DayType = 'start' | 'end';

export type weekDayLock = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];

export interface CalenderDayInfo {
  year: string;
  month: string;
  day: string;
  timestamp: number;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
}

/**
 * 公英制轉換係數
 */

/**
 * 1英哩 = 1.61公尺
 */
export const mi = 1.61;

/**
 * 1英呎 = 0.3048公尺
 */
export const ft = 0.3048;

/**
 * 1英吋 = 2.54公分
 */
export const inch = 2.54;

/**
 * 1英磅 = 0.45公斤
 */
export const lb = 0.45;

/**
 * 0. 公制 1. 英制
 */
export type Unit = unit.metric | unit.imperial;

/**
 * 0.公制 1.英制
 */
export enum unit {
  metric,
  imperial
}
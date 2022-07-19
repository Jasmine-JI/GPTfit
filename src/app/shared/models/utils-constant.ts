export const DAY = 24 * 60 * 60 * 1000;  // 一天的毫秒數
export const WEEK = 7 * DAY;
export const MONTH = 30 * WEEK;
export const SEASON = 3 * MONTH;
export const YEAR = 4 * SEASON;

export const DEVELOP_DOMAIN = '192.168.1.235';
export const UAT_DOMAIN = 'app.alatech.com.tw';
export const PROD_DOMAIN = 'www.gptfit.com';

/**
 * 群組 id 正則表達式
 */
export const REGEX_GROUP_ID = /0-0-(?<brandId>\w*)-(?<branchId>\w*)-(?<classId>\w*)-(?<subClassId>\w*)/;
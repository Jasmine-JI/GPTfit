export const DAY = 24 * 60 * 60 * 1000;  // 一天的毫秒數
export const WEEK = 7 * DAY;
export const MONTH = 30 * WEEK;
export const YEAR = 365 * MONTH;

export const TOKEN = 'ala_token';

export const DEVELOP_DOMAIN = '192.168.1.235';
export const UAT_DOMAIN = 'app.alatech.com.tw';
export const PROD_DOMAIN = 'www.gptfit.com';

/**
 * 群組 id 正則表達式
 */
export const REGEX_GROUP_ID = /0-0-(?<brandId>\w*)-(?<branchId>\w*)-(?<classId>\w*)-0/;
import { fromEvent, merge } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { QueryString } from '../enum/query-string';

export const DEFAULT_MAXLENGTH = {
  TEXT: 100,
  TEXTAREA: 2000,
};
export function isObjectEmpty(object) {
  if (!object) return true;

  return Object.keys(object).length === 0 && object.constructor === Object;
}

export function debounce(func, wait) {
  let timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    }

  };

  const debounced = function () {
    context = this;
    args = arguments;
    timestamp = Date.now();
    if (!timeout) {
      timeout = setTimeout(later, wait);
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };

  return debounced;
};

/**
 * 設定localStorage
 * @param key {any}-儲存localStorage時所使用的名稱
 * @param value {any}
 */
export function setLocalStorageObject(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 取得指定的localStorage資訊
 * @param key {any}-儲存localStorage時所使用的名稱
 */
export function getLocalStorageObject(key: string) {
  const value = localStorage.getItem(key);
  return value && JSON.parse(value);
}

/**
 * 移除指定的localStorage資訊
 * @param key {string}-儲存localStorage時所使用的名稱
 */
export function removeLocalStorageObject(key: string) {
  if (getLocalStorageObject(key)) {
    localStorage.removeItem(key);
  }
}

/**
 * 確認res resultCode是否回傳200(兼容兩個版本的response result)
 * @param res {any}-api response
 * @param showAlert {boolean}-是否顯示錯誤alert
 * @returns {boolean} resultCode是否回傳200
 * @author kidin-1100902
 */
export function checkResponse(res: any, showErrorMessage = true): boolean {
  const { processResult, resultCode: resCode, apiCode: resApiCode, resultMessage: resMsg } = res;
  if (!processResult) {

    if (resCode !== 200) {
      if (showErrorMessage) showErrorApiLog(resCode, resApiCode, resMsg);
      return false;
    }
    
  } else {
    const { resultCode, apiCode, resultMessage } = processResult;
    if (resultCode !== 200) {
      if (showErrorMessage) showErrorApiLog(resultCode, apiCode, resultMessage);
      return false;
    }

  }

  return true;
}

/**
 * 顯示api回傳之error log
 * @param resultCode {number}-api resultCode
 * @param apiCode {number}-api 流水編號
 * @param msg {string}-api 回傳訊息
 */
export function showErrorApiLog(resultCode: number, apiCode: number, msg: string) {
  console.error(`${resultCode}: Api ${apiCode} ${msg}`);
}

/**
 * 物件深拷貝
 * @param obj
 * @param cache
 * @author kidin-1090902
 */
export function deepCopy(obj: any, cache = new WeakMap()) {
  // 基本型別 & function
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Date 及 RegExp
  if (obj instanceof Date || obj instanceof RegExp) {
    return obj.constructor(obj);
  }

  // Set
  if (obj instanceof Set) {
    return new Set(obj);
  }

  // 檢查快取
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  // 使用原物件的 constructor
  const copy = new obj.constructor();

  // 先放入 cache 中
  cache.set(obj, copy);

  // 取出所有一般屬性 & 所有 key 為 symbol 的屬性
  [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)].forEach(key => {
    copy[key] = deepCopy(obj[key], cache);
  });

  return copy;
}

/**
 * 將query string轉為物件，以方便取值
 * @param _search {string}-query string
 * @returns {any}-物件 {queryKey: queryValue }
 * @author kidin-1100707
 */
export function getUrlQueryStrings(search: string = undefined) {
  const queryString = search || window.location.search;
  const queryObj = {} as any;
  let queryArr: Array<string>;

  if (!queryString) {
    return queryObj;
  } else {

    if (queryString.includes('?')) {
      queryArr = queryString.split('?')[1].split('&');
    } else {
      queryArr = queryString.split('&');
    }

    queryArr.forEach(_query => {
      const [_key, _value] = _query.split('=');
      Object.assign(queryObj, {[_key]: _value});
    });

    return queryObj;
  }

}

/**
 * 將參數物件轉為url query string
 * @param query {any}-參數物件
 */
export function setUrlQueryString(query: any) {
  let queryString = '';
  Object.entries(query).forEach(([key, value]) => {
    queryString += `${key}=${value}`;
  });

  return queryString ? `?${queryString}` : queryString;
}

/**
 * 四捨五入至小數點特定位數
 * @param decimal {number}-四捨五入位數
 * @param digit {number}-位數
 * @author kidin-1110318
 */
export function mathRounding(decimal: number, digit: number) {
  return parseFloat(decimal.toFixed(digit));
}

/**
 * 訂閱點擊與滾動事件
 * @param className {string}-html element class name
 */
export function subscribePluralEvent(className: string) {
  const scrollElement = document.querySelector(className);
  const scrollEvent = fromEvent(scrollElement, 'scroll');
  const clickEvent = fromEvent(document, 'click');
  return merge(scrollEvent, clickEvent);
}

/**
 * 取得各心率區間翻譯詞彙
 * @param translate {TranslateService}-翻譯套件
 */
export function getHrZoneTranslation(translate: TranslateService) {
  return [
    translate.instant('universal_activityData_limit_generalZone'),
    translate.instant('universal_activityData_limit_warmUpZone'),
    translate.instant('universal_activityData_limit_aerobicZone'),
    translate.instant('universal_activityData_limit_enduranceZone'),
    translate.instant('universal_activityData_limit_marathonZone'),
    translate.instant('universal_activityData_limit_anaerobicZone')
  ];

}

/**
 * 取得各閾值區間翻譯詞彙
 * @param translate {TranslateService}-翻譯套件
 */
export function getFtpZoneTranslation(translate: TranslateService) {
  return [
    translate.instant('universal_activityData_limit_ftpZ0'),
    translate.instant('universal_activityData_limit_ftpZ1'),
    translate.instant('universal_activityData_limit_ftpZ2'),
    translate.instant('universal_activityData_limit_ftpZ3'),
    translate.instant('universal_activityData_limit_ftpZ4'),
    translate.instant('universal_activityData_limit_ftpZ5'),
    translate.instant('universal_activityData_limit_ftpZ6')
  ];

}

/**
 * 取得各肌群翻譯詞彙
 * @param translate {TranslateService}-翻譯套件
 */
export function getMuscleGroupTranslation(translate: TranslateService) {
  return [
    translate.instant('universal_muscleName_armMuscles'),
    translate.instant('universal_muscleName_pectoralsMuscle'),
    translate.instant('universal_muscleName_shoulderMuscle'),
    translate.instant('universal_muscleName_backMuscle'),
    translate.instant('universal_muscleName_abdominalMuscle'),
    translate.instant('universal_muscleName_legMuscle')
  ];
}

/**
 * 計算百分比數據
 * @param molecular {number}-分子
 * @param denominator {number}-分母
 * @param decimal {number}-四捨五入位數
 */
export function countPercentage(molecular: number, denominator: number, decimal = 0) {
  return mathRounding((molecular ?? 0) / (denominator || Infinity) * 100, decimal);
}

/**
 * 變更顏色透明度
 * @param color {string}-顏色，格式為rgba
 */
export function changeOpacity(color: string, newOpacity: string | number) {
  const trimColor = color.replace(/\s/g,'');
  const rgbaReg = /^(rgba\(\d+,\d+,\d+,)(\d+)(\))$/;
  return trimColor.replace(rgbaReg, `$1${newOpacity}$3`);
}

/**
 * 根據fileInfo資訊之規則（以問號分隔參數）取得參數
 * @param info {string}-運動檔案之fileInfo內的任一資訊
 */
export function getFileInfoParam(info: string) {
  const [origin, ...rest] = info.split('?');
  let result: any = { origin };
  rest.forEach(_param => {
    const [key, value] = _param.split('=');
    result = { ...result, [key]: value };
  });

  return result;
}

/**
 * 將數值依係數轉換為另一值
 * @param value {number}-待轉換的值
 * @param convert {boolean}-是否轉換
 * @param forward {boolean}-是否為公制轉英制
 * @param coefficient {number}-轉換係數
 * @param digit {number}-四捨五入的位數
 */
export function valueConvert(
  value: number,
  convert: boolean,
  forward: boolean,
  coefficient: number,
  digit: number | null = null
) {
  if (convert) value = forward ? value / coefficient : value * coefficient;
  if (convert && forward) digit = 0; // 設定英制不含小數點
  return digit !== null ? mathRounding(value, digit) : value;
}

/**
 * 計算兩點gpx之間的距離（大圓距離）
 * @param gpxA {Array<number>}
 * @param gpxB {Array<number>}
 */
export function countDistance(gpxA: Array<number>, gpxB: Array<number>) {
  const earthR = 6371;  // km
  const radConst = Math.PI / 180;
  const [φA, λA] = [...gpxA];
  const [φB, λB] = [...gpxB];
  if (φA !== φB || λA !== λB) {
    const [φRA, λRA] = [...[φA * radConst, λA * radConst]];
    const [φRB, λRB] = [...[φB * radConst, λB * radConst]];
    const sigma = Math.acos(Math.sin(φRA) * Math.sin(φRB) + Math.cos(φRA) * Math.cos(φRB) * Math.cos(Math.abs(λRB - λRA)));
    return +(earthR * sigma * 1000).toFixed(0);
  } else {
    return 0;
  }
  
}

/**
 * 將query string物件內有效的參數轉為定義之header名稱
 * @param query {any}-url query string物件
 */
export function headerKeyTranslate(query: any) {
  let option = {};
  Object.entries(query).forEach(([_key, _value]) => {
    switch (_key) {
      case QueryString.deviceName:
        option = { deviceName: _value, ...option };
        break;
      case QueryString.appName:
        option = { appName: _value, ...option };
        break;
      case QueryString.appVersionCode:
        option = { appVersionCode: _value, ...option };
        break;
      case QueryString.appVersionName:
        option = { appVersionName: _value, ...option };
        break;
      case QueryString.equipmentSN:
        option = { equipmentSN: _value, ...option };
        break;
    }

  });

  return option;
}

/**
 * 將字串轉為有效base64字串
 * @param value {string}-待轉換之字串
 */
export function buildBase64ImgString(value: string) {
  if (!value) {
    return '';
  } else if (value.indexOf('data:image') > -1) {
    return value;
  } else if (value.indexOf('https://') > -1) {
    return value;
  } else {
    return `data:image/jpg; base64, ${value}`.replace(/\s+/g, '');
  }
}

/**
 * 取得現在時間
 * @param timeUnit {'s' | 'ms'}-時間單位
 * @author kidin-1101216
 */
export function getCurrentTimestamp(timeUnit: 's' | 'ms' = 's') {
  const currentTimeStamp = (new Date()).getTime();
  switch (timeUnit) {
    case 's':
      return Math.round(currentTimeStamp / 1000);
    case 'ms':
      return currentTimeStamp;
  }

}
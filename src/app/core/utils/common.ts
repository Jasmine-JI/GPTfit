import { fromEvent, merge } from 'rxjs';
import { QueryString } from '../../shared/enum/query-string';

export const DEFAULT_MAXLENGTH = {
  TEXT: 100,
  TEXTAREA: 2000,
};

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
  }

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
  [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)].forEach((key) => {
    copy[key] = deepCopy(obj[key], cache);
  });

  return copy;
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
 * 變更顏色透明度
 * @param color {string}-顏色，格式為rgba
 */
export function changeOpacity(color: string, newOpacity: string | number) {
  const trimColor = color.replace(/\s/g, '');
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
  rest.forEach((_param) => {
    const [key, value] = _param.split('=');
    result = { ...result, [key]: value };
  });

  return result;
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
  const currentTimeStamp = new Date().getTime();
  switch (timeUnit) {
    case 's':
      return Math.round(currentTimeStamp / 1000);
    case 'ms':
      return currentTimeStamp;
  }
}

/**
 * 確認該點是否在該範圍內
 * @param point {[number, number]}-座標
 * @param borderArr {Array<[number, number]>}-地區邊界座標
 */
export function handleBorderData(point: [number, number], borderArr: Array<[number, number]>) {
  const [x, y] = point;
  const borderArrLength = borderArr.length;
  let inside = false;
  for (let i = 0, j = borderArrLength - 1; i < borderArrLength; j = i++) {
    const [[xi, yi], [xj, yj]] = borderArr;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

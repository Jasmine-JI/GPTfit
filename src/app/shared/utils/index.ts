import { fromEvent, merge } from 'rxjs';

export const DEFAULT_MAXLENGTH = {
  TEXT: 100,
  TEXTAREA: 2000,
};
export function isObjectEmpty(object) {
  if (!object) return true;

  return Object.keys(object).length === 0 && object.constructor === Object;
}

export function debounce(func, wait) {
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    }

  };

  var debounced = function () {
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
export function setLocalStorageObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 取得指定的localStorage資訊
 * @param key {any}-儲存localStorage時所使用的名稱
 */
export function getLocalStorageObject(key) {
  const value = localStorage.getItem(key);
  return value && JSON.parse(value);
}

/**
 * 確認res resultCode是否回傳200(兼容兩個版本的response result)
 * @param res {any}-api response
 * @param showAlert {boolean}-是否顯示錯誤alert
 * @returns {boolean} resultCode是否回傳200
 * @author kidin-1100902
 */
export function checkResponse(res: any, showErrorMessage: boolean = true): boolean {
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
 * 四捨五入至小數點特定位數
 * @param decimal {number}-數值
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
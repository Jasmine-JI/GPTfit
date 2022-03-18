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

export function setLocalStorageObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalStorageObject(key) {
  const value = localStorage.getItem(key);
  return value && JSON.parse(value);
}

export function speedConverttoPace(value, type) {
  if (+value === 0 && (type === '1' || type === '4' || type === '6')) {
    return `60'00"`;
  }
  let yVal = (60 / +value) * 60;
  if (type === '1') {
    // 跑步配速
    const costminperkm = Math.floor(yVal / 60);
    const costsecondperkm = Math.round(yVal - costminperkm * 60);
    const timeMin = ('0' + costminperkm).slice(-2);
    const timeSecond = ('0' + costsecondperkm).slice(-2);
    return `${timeMin}'${timeSecond}"`;
  } else if (type === '4') {
    // 游泳配速
    yVal = ((60 / +value) * 60) / 10;
    const costminperkm = Math.floor(yVal / 60);
    const costsecondperkm = Math.round(yVal - costminperkm * 60);
    const timeMin = ('0' + costminperkm).slice(-2);
    const timeSecond = ('0' + costsecondperkm).slice(-2);
    return `${timeMin}'${timeSecond}"`;
  } else if (type === '6') {
    // 划水配速
    yVal = ((60 / +value) * 60) / 2;
    const costminperkm = Math.floor(yVal / 60);
    const costsecondperkm = Math.round(yVal - costminperkm * 60);
    const timeMin = ('0' + costminperkm).slice(-2);
    const timeSecond = ('0' + costsecondperkm).slice(-2);
    return `${timeMin}'${timeSecond}"`;
  } else {
    return +value;
  }
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
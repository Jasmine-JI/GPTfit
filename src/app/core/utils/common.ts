import { Observable, fromEvent, merge, of, throwError } from 'rxjs';
import { QueryString } from '../enums/common';
import { rgbaReg, hslaReg } from '../models/regex';
import { DateUnit } from '../../shared/enum/report';
import { ReportDateUnit } from '../../shared/classes/report-date-unit';
import dayjs from 'dayjs';

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
 * 確認回應是否有效，無效拋出錯誤並回傳resultCode
 * @param res api 回應
 * @param showErrorMsg 顯示錯誤訊息與否
 */
export function checkRxFlowResponse(res: any, showErrorMsg = false): Observable<any> {
  const isEffect = checkResponse(res, showErrorMsg);
  return isEffect ? of(res) : throwError(res.resultCode);
}

/**
 * 物件深拷貝，包含複製函式
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
 * @param color {string}-顏色，格式為rgba或hsla
 * @param opacity {number}-透明度
 */
export function changeOpacity(color: string, opacity: number) {
  if (color.includes('rgb')) {
    const {
      groups: { red, green, blue },
    } = rgbaReg.exec(color);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  } else if (color.includes('hsl')) {
    const {
      groups: { hue, saturation, lightness },
    } = hslaReg.exec(color);
    return `hsla(${hue}, ${saturation}, ${lightness}, ${opacity})`;
  }

  return color;
}

/**
 * 根據對象長度及對象序列，使用hsla分配顏色，
 * 可藉此確保同類型數據各個圖表顏色分配固定
 */
export function assignHslaColor(index: number, dataLength: number, arg: any = {}) {
  const saturation = arg.saturation ?? 60;
  const lightness = arg.lightness ?? 60;
  const opacity = arg.opacity ?? 1;
  const oneRangeDegree = dataLength ? Math.round(360 / dataLength) : 0;
  const hue = oneRangeDegree * index;
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
}

/**
 * 根據fileInfo資訊之規則（以?或&分隔參數）取得參數
 * @param info {string}-運動檔案之fileInfo內的任一資訊
 */
export function getFileInfoParam(info: string) {
  const [origin, ...rest] = info.split('?');
  let result: any = { origin };
  // 兼容使用?或&分隔參數
  rest.forEach((_params) => {
    const _deepParams = _params.split('&');
    _deepParams.forEach((_param) => {
      const [key, value] = _param.split('=');
      result = { ...result, [key]: value };
    });
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

/**
 * 根據報告日期單位與報告日期，取得所屬範圍
 * @param startTime {string}-開始時間
 * @param endTime {string}-結束時間
 * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
 */
export function getSameRangeDate(startTime: string, endTime: string, dateUnit: ReportDateUnit) {
  const startTimestamp = dayjs(startTime).startOf('day').valueOf();
  const endTimestamp = dayjs(endTime).endOf('day').valueOf();
  switch (dateUnit.unit) {
    case DateUnit.season: {
      const seasonStart = dayjs(startTimestamp).startOf('quarter').valueOf();
      const seasonEnd = dayjs(endTimestamp).endOf('quarter').valueOf();
      return { start: seasonStart, end: seasonEnd };
    }
    case DateUnit.year: {
      const rangeStart = dayjs(startTimestamp).startOf('year').valueOf();
      const rangeEnd = dayjs(endTimestamp).endOf('year').valueOf();
      return { start: rangeStart, end: rangeEnd };
    }
    default:
      return { start: startTimestamp, end: endTimestamp };
  }
}

/**
 * 根據序列取得對應月份的翻譯鍵
 * @param index {number}-月份序列，第一個月序列為0（同dayjs）
 */
export function getMonthKey(index: number) {
  switch (index) {
    case 0:
      return 'universal_time_january';
    case 1:
      return 'universal_time_february';
    case 2:
      return 'universal_time_march';
    case 3:
      return 'universal_time_april';
    case 4:
      return 'universal_time_may';
    case 5:
      return 'universal_time_june';
    case 6:
      return 'universal_time_july';
    case 7:
      return 'universal_time_august';
    case 8:
      return 'universal_time_september';
    case 9:
      return 'universal_time_october';
    case 10:
      return 'universal_time_november';
    case 11:
      return 'universal_time_december';
    default:
      return 'Index Error';
  }
}

/**
 * 根據序列取得對應月份的翻譯鍵
 * @param index {number}-月份序列，第一個月序列為0（同dayjs）
 * @param isAbbreviation {boolean}-是否用縮寫
 */
export function getWeekdayKey(index: number, isAbbreviation = true) {
  switch (index) {
    case 0:
      return isAbbreviation ? 'universal_time_mon' : 'universal_time_monday';
    case 1:
      return isAbbreviation ? 'universal_time_tue' : 'universal_time_tuesday';
    case 2:
      return isAbbreviation ? 'universal_time_wed' : 'universal_time_wednesday';
    case 3:
      return isAbbreviation ? 'universal_time_thu' : 'universal_time_thursday';
    case 4:
      return isAbbreviation ? 'universal_time_fri' : 'universal_time_friday';
    case 5:
      return isAbbreviation ? 'universal_time_sat' : 'universal_time_saturday';
    case 6:
      return isAbbreviation ? 'universal_time_sun' : 'universal_time_sunday';
  }
}

/**
 * 將api response特定格式資料拆解為好取得的格式
 * @param nameInfo 特殊格式名稱字串
 */
export function splitNameInfo(nameInfo: string): { [key: string]: string } {
  let result = {};
  const [name, ...rest] = nameInfo.split('?');
  rest.forEach((_restInfo) =>
    _restInfo.split('&').forEach((_info) => {
      const [key, value] = _info.split('=');
      result = { [key]: value, ...result };
    })
  );

  return {
    name,
    ...result,
  };
}

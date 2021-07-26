export const DEFAULT_MAXLENGTH = {
  TEXT: 100,
  TEXTAREA: 2000,
};
export function isObjectEmpty(object) {
  if (!object) return true;

  return Object.keys(object).length === 0 && object.constructor === Object;
}

export function buildPageMeta(_meta) {
  const meta = Object.assign(
    {},
    {
      pageNumber: 0,
      pageSize: 0,
      pageCount: 0
    },
    _meta
  );
  // const { pageSize, pageCount } = meta;
  const pageSize = meta.pageSize;
  const pageCount = meta.pageCount;
  const maxPage = Math.ceil(pageCount / pageSize) || 0;
  return {
    maxPage: maxPage,
    currentPage: meta.pageNumber,
    perPage: pageSize,
    total: pageCount
  };
}

export function debounce(func, wait, immediate) {
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  };

  var debounced = function () {
    context = this;
    args = arguments;
    timestamp = Date.now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };

  debounced.clear = function () {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  debounced.flush = function () {
    if (timeout) {
      result = func.apply(context, args);
      context = args = null;

      clearTimeout(timeout);
      timeout = null;
    }
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


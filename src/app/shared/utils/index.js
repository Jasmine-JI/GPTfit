import queryString from 'query-string';
import { cloneDeep } from 'lodash';

export const EMPTY_OBJECT = {};

export function isObjectEmpty(object) {
  if (!object) return true;

  return Object.keys(object).length === 0 && object.constructor === Object;
}

export function buildUrlQueryStrings(_params) {
  const params = isObjectEmpty(_params) ? EMPTY_OBJECT : cloneDeep(_params);
  // if (Object.keys(params).length) {
  //   for (var key in params) {
  //     if (!params[key]) delete params[key];
  //   }
  // }
  return queryString.stringify(params);
}

export function getUrlQueryStrings(_search) {
  const search = _search || window.location.search;
  if (!search) return EMPTY_OBJECT;
  return queryString.parse(search);
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

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

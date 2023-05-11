/**
 * 將query string轉為物件，以方便取值
 * @param _search {string}-query string
 * @returns {any}-物件 {queryKey: queryValue }
 */
export function getUrlQueryStrings(search?: string) {
  const queryString = search || window.location.search;
  const queryObj = {} as { [key: string]: any };
  let queryArr: Array<string>;

  if (!queryString) {
    return queryObj;
  } else {
    if (queryString.includes('?')) {
      queryArr = queryString.split('?')[1].split('&');
    } else {
      queryArr = queryString.split('&');
    }

    queryArr.forEach((_query) => {
      const [_key, _value] = _query.split('=');
      Object.assign(queryObj, { [_key]: _value });
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
    const newQuery = `${key}=${value}`;
    queryString += queryString ? `&${newQuery}` : `?${newQuery}`;
  });

  return queryString;
}

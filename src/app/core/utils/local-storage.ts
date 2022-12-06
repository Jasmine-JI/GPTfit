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

/**
 * 用來管理多個非順序性的切換狀態
 */
export class MultipleUnfoldStatus {
  private _status = new Map<string, boolean>();

  /**
   * 建立新的狀態
   * @param key 該狀態鍵名
   * @param status 預設的狀態
   */
  setNewStatus(key: string, status = false) {
    this._status.set(key, status);
  }

  /**
   * 取得狀態
   * @param key 該狀態鍵名
   * @param defaultStatus 預設的狀態
   */
  getStatus(key: string, defaultStatus = false) {
    return this._status.get(key) ?? defaultStatus;
  }

  /**
   * 切換狀態
   * @param key 該狀態鍵名
   */
  toggleStatus(key: string) {
    this._status.set(key, !this._status.get(key));
  }

  /**
   * 移除所有狀態
   */
  removeAllStatus() {
    this._status.clear();
  }

  /**
   * 變更所有狀態為指定狀態
   * @param status {boolean}
   */
  changeAllStatus(status: boolean) {
    this._status.forEach((_value, _key) => {
      this._status.set(_key, status);
    });
  }
}

import { Injectable } from '@angular/core';
import { LocalStorageKey } from '../../shared/enum/local-storage-key';

/**
 * 統一管理與localstorage的存取
 */
@Injectable({
  providedIn: 'root',
})
export class LocalstorageService {
  constructor() {}

  /**
   * 取得是否使用isoWeek（週一當一週的第一天）
   */
  getIsoWeekStatus(): boolean {
    const stringResult = localStorage.getItem(LocalStorageKey.useIsoWeek) as string;
    return stringResult ? (JSON.parse(stringResult) as boolean) : true;
  }

  /**
   * 儲存是否使用isoWeek（週一當一週的第一天）
   */
  setIsoWeekStatus(status: boolean) {
    localStorage.setItem(LocalStorageKey.useIsoWeek, JSON.stringify(status));
  }
}

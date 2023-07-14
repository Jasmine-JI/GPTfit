import { Injectable } from '@angular/core';
import { LocalStorageKey } from '../enums/common';
import { SportType } from '../enums/sports';
import { QuadrantSetting } from '../models/compo';

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

  /**
   * 取得報告數據表格欄位顯示設定
   */
  getReportTableDataOption() {
    const stringResult = localStorage.getItem(LocalStorageKey.sportsReportTableData) as string;
    return stringResult ? JSON.parse(stringResult) : undefined;
  }

  /**
   * 儲存報告數據表格欄位顯示設定
   * @param option {any}
   */
  setReportTableDataOption(option: any) {
    localStorage.setItem(LocalStorageKey.sportsReportTableData, JSON.stringify(option));
  }

  /**
   * 取得是否包含管理員的設定
   */
  getAdminInclusion() {
    const stringResult = localStorage.getItem(LocalStorageKey.includeAdmin) as string;
    return stringResult ? stringResult === 'true' : true;
  }

  /**
   * 儲存是否包含管理員的設定
   * @param option {boolean}-是否包含管理員
   */
  setAdminInclusion(option: boolean) {
    localStorage.setItem(LocalStorageKey.includeAdmin, JSON.stringify(option));
  }

  /**
   * 根據運動類別取得相對應的象限圖設定
   * @param sportsType 運動類別
   */
  getQuadrantSetting(sportsType: SportType) {
    const key = this.getQuadrantSettingKey(sportsType);
    const stringResult = localStorage.getItem(key) as string;
    return JSON.parse(stringResult);
  }

  /**
   * 根據運動類別儲存相對應的象限圖設定
   * @param sportsType 運動類別
   */
  setQuadrantSetting(sportsType: SportType, option: QuadrantSetting) {
    const key = this.getQuadrantSettingKey(sportsType);
    localStorage.setItem(key, JSON.stringify(option));
  }

  /**
   * 根據運動類別移除相對應的象限圖設定
   * @param sportsType 運動類別
   */
  removeQuadrantSetting(sportsType: SportType) {
    const key = this.getQuadrantSettingKey(sportsType);
    localStorage.removeItem(key);
  }

  /**
   * 根據運動類別取得相對應的象限圖設定儲存鍵名
   * @param sportsType
   */
  private getQuadrantSettingKey(sportsType: SportType) {
    switch (sportsType) {
      case SportType.run:
        return LocalStorageKey.quadrantSettingRun;
      case SportType.swim:
        return LocalStorageKey.quadrantSettingSwim;
      case SportType.row:
        return LocalStorageKey.quadrantSettingRow;
      default:
        return LocalStorageKey.quadrantSettingCycle;
    }
  }
}

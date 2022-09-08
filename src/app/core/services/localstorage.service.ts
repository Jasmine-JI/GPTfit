import { Injectable } from '@angular/core';
import { LocalStorageKey } from '../../shared/enum/local-storage-key';
import { AdvancedTargetOption } from '../models/localstorage/sports-target.model';

/**
 * 統一管理與localstorage的存取
 */
@Injectable({
  providedIn: 'root',
})
export class LocalstorageService {
  constructor() {}

  /**
   * 取得運動目標進階開關狀態
   */
  getAdvancedSportsTarget(): AdvancedTargetOption | null {
    const jsonString = localStorage.getItem(LocalStorageKey.advancedSportsTarget);
    return jsonString ? JSON.parse(jsonString) : { professional: false, personal: false };
  }

  /**
   * 儲存運動目標進階開關狀態
   */
  setAdvancedSportsTarget(obj: AdvancedTargetOption) {
    const jsonString = JSON.stringify(obj);
    localStorage.setItem(LocalStorageKey.advancedSportsTarget, jsonString);
  }
}

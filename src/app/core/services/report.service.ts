import { Injectable } from '@angular/core';
import { Api21xxService } from './api-21xx.service';
import { deepCopy } from '../../shared/utils/index';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  /**
   * 儲存api 2104回傳之基準運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  baseActivityData: Array<any>;

  /**
   * 儲存api 2104回傳之比較運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  compareActivityData: Array<any>;

  /**
   * 儲存api 2107回傳之基準運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  baseLifeTracking: Array<any>;

  /**
   * 儲存api 2107回傳之比較運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  compareLifeTracking: Array<any>;

  constructor(private api21xxService: Api21xxService) {}

  /**
   * 儲存基準數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveBaseActivitiesData(data: Array<any>) {
    this.baseActivityData = deepCopy(data);
  }

  /**
   * 取得先前儲存的基準數據
   * @author kidin-1110321
   */
  getBaseActivitiesData() {
    return this.baseActivityData;
  }

  /**
   * 儲存比較數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveCompareActivitiesData(data: Array<any>) {
    this.compareActivityData = deepCopy(data);
  }

  /**
   * 取得先前儲存的比較數據
   * @author kidin-1110321
   */
  getCompareActivitiesData() {
    return this.compareActivityData;
  }

  /**
   * 儲存基準數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveBaseLifeTracking(data: Array<any>) {
    this.baseLifeTracking = deepCopy(data);
  }

  /**
   * 取得先前儲存的基準數據
   * @author kidin-1110321
   */
  getBaseLifeTracking() {
    return this.baseLifeTracking;
  }

  /**
   * 儲存比較數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveCompareLifeTracking(data: Array<any>) {
    this.compareLifeTracking = deepCopy(data);
  }

  /**
   * 取得先前儲存的比較數據
   * @author kidin-1110321
   */
  getCompareLifeTracking() {
    return this.compareLifeTracking;
  }
}

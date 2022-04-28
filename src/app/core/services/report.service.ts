import { Injectable } from '@angular/core';
import { Api21xxService } from './api-21xx.service';
import { deepCopy } from '../../shared/utils/index';


@Injectable({
  providedIn: 'root'
})
export class ReportService {

  /**
   * 儲存api 2104回傳之基準運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  baseData: Array<any>;

  /**
   * 儲存api 2104回傳之比較運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  compareData: Array<any>;

  constructor(private api21xxService: Api21xxService) {}

  /**
   * 儲存基準數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveBaseData(data: Array<any>) {
    this.baseData = deepCopy(data);
  }

  /**
   * 取得先前儲存的基準數據
   * @author kidin-1110321
   */
  getBaseData() {
    return this.baseData;
  }

  /**
   * 儲存比較數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveCompareData(data: Array<any>) {
    this.compareData = deepCopy(data);
  }

  /**
   * 取得先前儲存的比較數據
   * @author kidin-1110321
   */
  getCompareData() {
    return this.compareData;
  }

}

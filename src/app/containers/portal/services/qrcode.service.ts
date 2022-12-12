import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class QrcodeService {
  showFitPairSetting = false;

  constructor(private http: HttpClient) {}

  /**
   * 設定是否顯示fitPair設定框
   * @param show {boolean}-是否顯示fitPair設定框
   * @author kidin-1100709
   */
  setFitPairSettingMsg(show: boolean) {
    this.showFitPairSetting = show;
  }

  /**
   * 是否顯示fitPair設定框
   * @returns {boolean}
   * @author kidin-1100709
   */
  getFitPairSettingMsg(): boolean {
    return this.showFitPairSetting;
  }

  /**
   * 建立裝置日誌checksum
   * @param sn {string}-sn碼
   * @author kidin-1100716
   */
  createDeviceChecksum(sn: string): string {
    const weighted = [2, 2, 6, 1, 8, 3, 4, 1, 1, 1, 1, 1, 1, 1];
    let oddTotal = 0,
      evenTotal = 0;
    for (let i = 0, len = sn.length; i < len; i++) {
      const weightedValue = sn.charCodeAt(i) * weighted[i];
      if ((i + 1) % 2 === 0) {
        evenTotal += weightedValue;
      } else {
        oddTotal += weightedValue;
      }
    }

    const multiplyStr = `${evenTotal * oddTotal}`,
      multiplyStrLen = multiplyStr.length,
      checkSum = multiplyStr.slice(multiplyStrLen - 4, multiplyStrLen);
    return checkSum;
  }
}

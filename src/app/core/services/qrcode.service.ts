import { Injectable } from '@angular/core';

@Injectable()
export class QrcodeService {
  showFitPairSetting = false;

  constructor() {}

  /**
   * 設定是否顯示fitPair設定框
   * @param show {boolean}-是否顯示fitPair設定框
   */
  setFitPairSettingMsg(show: boolean) {
    this.showFitPairSetting = show;
  }

  /**
   * 是否顯示fitPair設定框
   * @returns {boolean}
   */
  getFitPairSettingMsg(): boolean {
    return this.showFitPairSetting;
  }

  /**
   * 建立裝置日誌checksum
   * @param sn {string}-sn碼
   */
  createDeviceChecksum(sn: string): string {
    const weighted = [2, 2, 6, 1, 8, 3, 4, 1, 1, 1, 1, 1, 1, 1];
    let oddTotal = 0;
    let evenTotal = 0;
    for (let i = 0, len = sn.length; i < len; i++) {
      const weightedValue = sn.charCodeAt(i) * weighted[i];
      if ((i + 1) % 2 === 0) {
        evenTotal += weightedValue;
      } else {
        oddTotal += weightedValue;
      }
    }

    const multiplyStr = `${evenTotal * oddTotal}`;
    const multiplyStrLen = multiplyStr.length;
    const checkSum = multiplyStr.slice(multiplyStrLen - 4, multiplyStrLen);
    return checkSum;
  }
}

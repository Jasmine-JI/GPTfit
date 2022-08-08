import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dataFlowConversion' })
export class DataFlowConversionPipe implements PipeTransform {
  /**
   * 轉換資料量大小與對應單位
   * @param value {number}-資料量
   * @author kidin-1100810
   */
  transform(value: number): string {
    const kb = 1024,
      mb = 1024 * kb,
      gb = 1024 * mb,
      tb = 1024 * gb,
      pb = 1024 * tb,
      eb = 1024 * pb;
    const final = (val, unit) => `${parseFloat(val.toFixed(2))} ${unit}`;
    if (value > eb) {
      return final(value / eb, 'EB');
    } else if (value > pb) {
      return final(value / pb, 'PB');
    } else if (value > tb) {
      return final(value / tb, 'TB');
    } else if (value > gb) {
      return final(value / gb, 'GB');
    } else if (value > mb) {
      return final(value / mb, 'MB');
    } else if (value > kb) {
      return final(value / kb, 'KB');
    } else {
      return `${value} Byte`;
    }
  }
}

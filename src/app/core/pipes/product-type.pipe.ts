import { Pipe, PipeTransform } from '@angular/core';
import { getDevicTypeInfo } from '../utils/device';

@Pipe({
  name: 'productType',
  standalone: true,
})
export class ProductTypePipe implements PipeTransform {
  /**
   * 根據裝置類型回傳對應多國語系的鍵或佈景圖片路徑
   * @param value {string | number}-裝置類別名稱或代號
   */
  transform(value: string | number, arg: 'key' | 'imgPath' | 'color' = 'key') {
    return getDevicTypeInfo(`${value}`, arg);
  }
}

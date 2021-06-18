import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'systemId'})
export class SystemIdPipe implements PipeTransform {
  /**
   * 根據系統類別回傳對應系統名稱
   * @param value {string | number}-系統類別代碼
   * @return {string}-系統名稱
   * @author kidin
   */
  transform(value: number): string {
    switch (value) {
      case 0:
        return 'Web'
      case 1:
        return 'iOS';
      case 2:
        return 'Android';
    }

  }

}

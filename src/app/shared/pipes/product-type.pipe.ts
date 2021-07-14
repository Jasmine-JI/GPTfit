import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'productType'})
export class ProductTypePipe implements PipeTransform {
  /**
   * 根據裝置類型回傳對應多國語系的鍵或佈景圖片路徑
   * @param value {string | number}-裝置類別名稱或代號
   * @returns {string}-翻譯的鍵
   */
  transform(value: string | number, arg: 'key' | 'imgPath' = 'key'): string {
    const imgDir = '/app/public_html/img/devicebg';
    const device = {
      wearable: {
        key: 'universal_vocabulary_wearableDevice',
        imgPath: `${imgDir}/wearable.jpg`
      },
      treadmill: {
        key: 'universal_vocabulary_treadmill',
        imgPath: `${imgDir}/run.jpg`
      },
      spinBike: {
        key: 'universal_vocabulary_spinBike',
        imgPath: `${imgDir}/bike.jpg`
      },
      rowMachine: {
        key: 'universal_vocabulary_rowingMachine',
        imgPath: `${imgDir}/row.jpg`
      },
      sensor: {
        key: 'universal_vocabulary_sensor',
        imgPath: `${imgDir}/wt.jpg`
      },
    };
    switch (value + '') {
      case '1':
      case 'wearable':
        return device.wearable[arg];
      case '2':
      case 'treadmill':
        return device.treadmill[arg];
      case '3':
      case 'spinBike':
        return device.spinBike[arg];
      case '4':
      case 'rowMachine':
        return device.rowMachine[arg];
      case '5':
      case 'sensor':
        return device.sensor[arg];
      default:
        return 'unknown type';
    }

  }

}
